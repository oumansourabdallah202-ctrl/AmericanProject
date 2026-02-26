import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { sendLocalNotification, subscribeUserToPush } from "@/lib/pushNotifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Download, Eye, List, Loader2, LogOut, Mail, MailX, Pencil, Plus, Search, Trash2, Upload, UserCheck, Users, X } from "lucide-react";
import { supabase, isSupabaseAuthConfigured } from "@/lib/supabaseClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTimeSlotsForDate } from "@/lib/blockedSlots";

/** Parse YYYY-MM-DD as local date (avoids timezone shifting the day). */
function parseLocalDate(ymd: string): Date {
  return new Date(ymd + "T12:00:00");
}

export type BookingRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string | null;
  status: string;
  createdAt?: string;
  sentEmails?: Array<{ id: string; type: string; sentAt: string }>;
};

export type ClientRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  createdAt?: string;
  lastBookingDate?: string | null;
};

function getAuthHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

const POLL_INTERVAL_MS = 45_000;
const PAGE_SIZE_RESERVATIONS = 100;
const PAGE_SIZE_CLIENTS = 100;

/** Party sizes allowed in the edit form Select; 1–20 avoids "value not in list" → removeChild on Android. */
const ALLOWED_PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function Admin() {
  const { t, language } = useLanguage();

  /** Modal labels: use explicit strings so we never show raw i18n keys (admin.modifyReservation etc.). */
  const lang = language === "en" ? "en" : language === "it" ? "it" : "fr";
  const modalLabels = {
    modifyReservation: { en: "Modify reservation", fr: "Modifier la réservation", it: "Modifica prenotazione" }[lang],
    modify: { en: "Modify", fr: "Modifier", it: "Modifica" }[lang],
    cancelEdit: { en: "Cancel", fr: "Annuler", it: "Annulla" }[lang],
    saveReservation: { en: "Save", fr: "Enregistrer", it: "Salva" }[lang],
  };
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [fetchError, setFetchError] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncFromWixLoading, setSyncFromWixLoading] = useState(false);
  const [deleteGuestPlaceholdersLoading, setDeleteGuestPlaceholdersLoading] = useState(false);
  const [deleteGuestPlaceholdersOpen, setDeleteGuestPlaceholdersOpen] = useState(false);
  const [exportGuestsLoading, setExportGuestsLoading] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [markAllArchiving, setMarkAllArchiving] = useState(false);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientsError, setClientsError] = useState("");
  const [clientsMessage, setClientsMessage] = useState<string | null>(null);
  const [importingClients, setImportingClients] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientSort, setClientSort] = useState<"name" | "email" | "date">("date");
  const [clientsPage, setClientsPage] = useState(0);
  const [bookingSort, setBookingSort] = useState<"created" | "date" | "name">("date");
  const [allReservationsSort, setAllReservationsSort] = useState<"date" | "name" | "created">("date");
  const [allReservationsSortOrder, setAllReservationsSortOrder] = useState<"asc" | "desc">("desc");
  const [allReservationsSearch, setAllReservationsSearch] = useState("");
  const [allReservationsPage, setAllReservationsPage] = useState(0);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestDateFilter, setRequestDateFilter] = useState<string>("");
  const [requestSort, setRequestSort] = useState<"date" | "time" | "name" | "guests">("date");
  const [requestSortOrder, setRequestSortOrder] = useState<"asc" | "desc">("desc");
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [addClientName, setAddClientName] = useState("");
  const [addClientEmail, setAddClientEmail] = useState("");
  const [addClientPhone, setAddClientPhone] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [addFromListOpen, setAddFromListOpen] = useState(false);
  const [addFromListText, setAddFromListText] = useState("");
  const [addFromListSaving, setAddFromListSaving] = useState(false);
  const [syncingReservationsToClients, setSyncingReservationsToClients] = useState(false);
  const [syncingFromResend, setSyncingFromResend] = useState(false);
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [dailyListDate, setDailyListDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [bookingDetailId, setBookingDetailId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<{
    booking: BookingRecord;
    emailStatuses: Array<{ id: string; type: string; sentAt: string; status?: string }>;
  } | null>(null);
  const [bookingDetailLoading, setBookingDetailLoading] = useState(false);
  const [bookingDetailEditOpen, setBookingDetailEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPartySize, setEditPartySize] = useState(2);
  const [editStatus, setEditStatus] = useState<"confirmed" | "request" | "pending" | "cancelled" | "archived">("confirmed");
  const [savingBooking, setSavingBooking] = useState(false);
  const [sendingConfirmationId, setSendingConfirmationId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [calendarView, setCalendarView] = useState<"all" | "requests">("all");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  /** Resend email id -> delivery status (bounced, delivered, sent, ...) for list-view bounced flags */
  const [emailStatusByResendId, setEmailStatusByResendId] = useState<Record<string, string>>({});

  // Sync selected date with calendar month: when selected is outside current month, navigate calendar to that month
  useEffect(() => {
    const selectedDate = parseLocalDate(selectedCalendarDate);
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const calendarYear = calendarMonth.getFullYear();
    const calendarMonthNum = calendarMonth.getMonth();
    if (selectedYear !== calendarYear || selectedMonth !== calendarMonthNum) {
      setCalendarMonth(new Date(selectedYear, selectedMonth, 1));
    }
  }, [selectedCalendarDate, calendarMonth]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        setUserEmail(session.user?.email ?? null);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const verifyToken = async () => {
    if (!token) return false;
    try {
      const res = await fetch("/api/admin/login", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return true;
    } catch {
      /* ignore */
    }
    setToken(null);
    return false;
  };

  const previousBookingIds = useRef<Set<string>>(new Set());
  const wixAutoSyncRanRef = useRef(false);
  const deleteGuestPlaceholdersRanRef = useRef(false);

  const fetchBookings = useCallback(async (authToken: string) => {
    setFetchError("");
    try {
      const res = await fetch("/api/bookings", { headers: getAuthHeaders(authToken) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.bookings)) {
        const newBookings = data.bookings as BookingRecord[];
        const newIds = new Set(newBookings.map((b) => b.id));
        const added = newBookings.filter((b) => !previousBookingIds.current.has(b.id));
        if (previousBookingIds.current.size > 0 && added.length > 0) {
          const message = t("admin.newReservationNotification").replace("{count}", String(added.length));
          toast.success(message, {
            duration: 10000,
          });
          
          // Send push notification
          sendLocalNotification({
            title: 'Spinella - Nouvelle réservation',
            body: added.length === 1 
              ? `${added[0].name} - ${added[0].date} à ${added[0].time}`
              : `${added.length} nouvelles réservations reçues`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'new-reservation',
            requireInteraction: true,
            data: { url: '/admin', bookings: added },
            vibrate: [200, 100, 200, 100, 200],
          }).catch((err) => console.error('[Push] Failed to send notification:', err));
        }
        previousBookingIds.current = newIds;
        setBookings(newBookings);
        // Fetch Resend delivery statuses for list-view bounced flags
        const emailIds = [...new Set(newBookings.flatMap((b) => (b.sentEmails ?? []).map((e) => e.id)).filter(Boolean))];
        if (emailIds.length > 0) {
          fetch("/api/bookings/email-statuses", {
            method: "POST",
            headers: { ...getAuthHeaders(authToken), "Content-Type": "application/json" },
            body: JSON.stringify({ ids: emailIds }),
          })
            .then((r) => r.json().catch(() => ({})))
            .then((d) => (d.statuses && typeof d.statuses === "object" ? setEmailStatusByResendId(d.statuses) : null))
            .catch(() => {});
        } else {
          setEmailStatusByResendId({});
        }
      } else {
        setFetchError(t("admin.fetchError"));
      }
    } catch {
      setFetchError(t("admin.fetchError"));
    }
  }, [t]);

  const fetchClients = useCallback(async (authToken: string) => {
    setClientsError("");
    try {
      const res = await fetch("/api/clients", { headers: getAuthHeaders(authToken) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.clients)) {
        setClients(data.clients);
      } else {
        setClientsError(t("admin.clientsFetchError"));
      }
    } catch {
      setClientsError(t("admin.clientsFetchError"));
    }
  }, [t]);

  const allReservationsFiltered = useMemo(() => {
    const q = allReservationsSearch.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        (b.phone ?? "").toLowerCase().includes(q) ||
        b.date.includes(q) ||
        b.time.includes(q)
    );
  }, [bookings, allReservationsSearch]);

  const allReservationsSorted = useMemo(() => {
    return [...allReservationsFiltered].sort((a, b) => {
      let comparison = 0;
      if (allReservationsSort === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (allReservationsSort === "created") {
        comparison = (b.createdAt || "").localeCompare(a.createdAt || "");
      } else {
        comparison = b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
      }
      return allReservationsSortOrder === "asc" ? -comparison : comparison;
    });
  }, [allReservationsFiltered, allReservationsSort, allReservationsSortOrder]);

  const allReservationsPaginated = useMemo(() => {
    const start = allReservationsPage * PAGE_SIZE_RESERVATIONS;
    return allReservationsSorted.slice(start, start + PAGE_SIZE_RESERVATIONS);
  }, [allReservationsSorted, allReservationsPage]);

  const totalReservationsPages = Math.max(1, Math.ceil(allReservationsSorted.length / PAGE_SIZE_RESERVATIONS));

  const filteredAndSortedClients = useMemo(() => {
    let list = [...clients];
    const q = clientSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (clientSort === "name") return a.name.localeCompare(b.name);
      if (clientSort === "email") return a.email.localeCompare(b.email);
      const aDate = a.lastBookingDate ?? a.createdAt ?? "";
      const bDate = b.lastBookingDate ?? b.createdAt ?? "";
      return bDate.localeCompare(aDate);
    });
    return list;
  }, [clients, clientSearch, clientSort]);

  const clientsPaginated = useMemo(() => {
    const start = clientsPage * PAGE_SIZE_CLIENTS;
    return filteredAndSortedClients.slice(start, start + PAGE_SIZE_CLIENTS);
  }, [filteredAndSortedClients, clientsPage]);

  const totalClientsPages = Math.max(1, Math.ceil(filteredAndSortedClients.length / PAGE_SIZE_CLIENTS));

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !addClientEmail.trim()) return;
    setSavingClient(true);
    setClientsError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          name: addClientName.trim() || addClientEmail.trim(),
          email: addClientEmail.trim(),
          phone: addClientPhone.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(typeof data?.error === "string" ? data.error : "Failed");
      setAddClientOpen(false);
      setAddClientName("");
      setAddClientEmail("");
      setAddClientPhone("");
      await fetchClients(token);
      setClientsMessage(t("admin.clientsImportSuccess").replace("{count}", "1"));
    } catch (err) {
      setClientsError(err instanceof Error ? err.message : t("admin.clientsImportError"));
    } finally {
      setSavingClient(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!token) return;
    setDeletingClientId(id);
    try {
      const res = await fetch("/api/clients", {
        method: "DELETE",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Failed");
      setDeleteClientId(null);
      await fetchClients(token);
    } catch (err) {
      setClientsError(err instanceof Error ? err.message : t("admin.clientsImportError"));
    } finally {
      setDeletingClientId(null);
    }
  };

  const handleExportCsv = (selectedOnly = false) => {
    const toExport = selectedOnly && selectedClientIds.size > 0
      ? filteredAndSortedClients.filter(c => selectedClientIds.has(c.id))
      : filteredAndSortedClients;
    
    const headers = ["Name", "Email", "Phone", "Source", "Added"];
    const rows = toExport.map((c) => [
      `"${(c.name ?? "").replace(/"/g, '""')}"`,
      `"${(c.email ?? "").replace(/"/g, '""')}"`,
      `"${(c.phone ?? "").replace(/"/g, '""')}"`,
      `"${(c.source ?? "").replace(/"/g, '""')}"`,
      c.createdAt ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `spinella-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportBookingsCsv = (selectedOnly = false) => {
    const toExport = selectedOnly && selectedBookingIds.size > 0
      ? bookings.filter(b => selectedBookingIds.has(b.id))
      : bookings;
    
    const headers = ["Date", "Time", "Name", "Email", "Phone", "Guests", "Status", "Special requests", "Created At"];
    const rows = toExport.map((b) => [
      b.date,
      b.time,
      `"${(b.name ?? "").replace(/"/g, '""')}"`,
      b.email,
      `"${(b.phone ?? "").replace(/"/g, '""')}"`,
      b.partySize,
      b.status,
      `"${(b.specialRequests ?? "").replace(/"/g, '""')}"`,
      b.createdAt || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `spinella-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportGuestsThisMonth = async () => {
    if (!token) return;
    setExportGuestsLoading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const res = await fetch(
        `/api/bookings/guests-export?year=${year}&month=${month}&format=csv`,
        { headers: getAuthHeaders(token) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Export failed");
        return;
      }
      if (typeof data.csv !== "string") {
        toast.error("No data");
        return;
      }
      const blob = new Blob(["\uFEFF" + data.csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = data.filename ?? `spinella-guests-${year}-${String(month).padStart(2, "0")}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${data.count ?? 0} emails exportés`);
    } finally {
      setExportGuestsLoading(false);
    }
  };

  const handleImportBookingsCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    e.target.value = ""; // Reset input
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV file is empty");
        return;
      }
      
      const parseLine = (line: string) => {
        const result: string[] = [];
        let cur = "";
        let inQ = false;
        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (c === '"') inQ = !inQ;
          else if (c === "," && !inQ) {
            result.push(cur.trim());
            cur = "";
          } else cur += c;
        }
        result.push(cur.trim());
        return result;
      };
      
      const headers = parseLine(lines[0]);
      const bookingsToImport = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        if (values.length < 6) continue;
        
        const [date, time, name, email, phone, guests, status, specialRequests] = values;
        if (!date || !time || !name || !email) continue;
        
        bookingsToImport.push({
          date: date.trim(),
          time: time.trim(),
          name: name.replace(/^"|"$/g, "").trim(),
          email: email.trim(),
          phone: phone.replace(/^"|"$/g, "").trim(),
          partySize: parseInt(guests) || 1,
          status: status || "request",
          specialRequests: specialRequests?.replace(/^"|"$/g, "").trim() || null,
        });
      }
      
      if (bookingsToImport.length === 0) {
        toast.error("No valid bookings found in CSV");
        return;
      }
      
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "import", bookings: bookingsToImport }),
      });
      
      if (!res.ok) throw new Error("Import failed");
      
      await fetchBookings(token);
      toast.success(`Imported ${bookingsToImport.length} bookings`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  };

  const handleExportClientsCsv = (selectedOnly = false) => {
    const toExport = selectedOnly && selectedClientIds.size > 0
      ? clients.filter(c => selectedClientIds.has(c.id))
      : clients;
    
    const headers = ["Name", "Email", "Phone", "Source", "Created At"];
    const rows = toExport.map((c) => [
      `"${(c.name ?? "").replace(/"/g, '""')}"`,
      `"${(c.email ?? "").replace(/"/g, '""')}"`,
      `"${(c.phone ?? "").replace(/"/g, '""')}"`,
      `"${(c.source ?? "").replace(/"/g, '""')}"`,
      c.createdAt ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `spinella-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleAddFromList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !addFromListText.trim()) return;
    const lines = addFromListText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const toImport: { name: string; email: string; phone: string | null }[] = [];
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const line of lines) {
      const parts = line.split(/[\t,]/).map((p) => p.trim()).filter(Boolean);
      let name = "";
      let email = "";
      const phone = (parts[2] ?? "").slice(0, 50) || null;
      if (parts.length >= 2 && emailRe.test(parts[1])) {
        name = (parts[0] ?? "").slice(0, 200);
        email = parts[1].toLowerCase();
      } else if (parts.length >= 2 && emailRe.test(parts[0])) {
        email = parts[0].toLowerCase();
        name = (parts[1] ?? email).slice(0, 200);
      } else if (parts.length === 1 && emailRe.test(parts[0])) {
        email = parts[0].toLowerCase();
        name = email;
      } else continue;
      toImport.push({ name, email, phone });
    }
    if (toImport.length === 0) {
      setClientsError("No valid lines (each line needs at least an email, e.g. Name, Email, Phone).");
      return;
    }
    setAddFromListSaving(true);
    setClientsError("");
    try {
      const BATCH = 200;
      let imported = 0;
      for (let i = 0; i < toImport.length; i += BATCH) {
        const batch = toImport.slice(i, i + BATCH);
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify({ clients: batch }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(typeof data?.error === "string" ? data.error : "Import failed");
        imported += batch.length;
      }
      setAddFromListOpen(false);
      setAddFromListText("");
      await fetchClients(token);
      setClientsMessage(t("admin.clientsImportSuccess").replace("{count}", String(imported)));
    } catch (err) {
      setClientsError(err instanceof Error ? err.message : t("admin.clientsImportError"));
    } finally {
      setAddFromListSaving(false);
    }
  };

  const handleImportCsvClients = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setImportingClients(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setClientsError("CSV file is empty or has no data rows");
        return;
      }
      const parseLine = (line: string) => {
        const result: string[] = [];
        let cur = "";
        let inQ = false;
        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (c === '"') inQ = !inQ;
          else if (c === "," && !inQ) {
            result.push(cur.trim());
            cur = "";
          } else cur += c;
        }
        result.push(cur.trim());
        return result;
      };
      const headers = parseLine(lines[0]).map((h) => h.trim());
      // Email: E-mail 1, E-mail, email, etc.
      let emailIdx = headers.findIndex((h) => /e-mail 1|e-mail|^email$/i.test(h));
      if (emailIdx < 0) emailIdx = 2;
      // Name: single "name" or "Name", or Prénom + Nom de famille
      const nameIdx = headers.findIndex((h) => /^name$|^nom$|^nombre$/i.test(h));
      const prenomIdx = headers.findIndex((h) => /prénom|prenom/i.test(h));
      const nomIdx = headers.findIndex((h) => /nom de famille|nom$/i.test(h));
      // Phone: Téléphone 1, Téléphone, phone, etc.
      let phoneIdx = headers.findIndex((h) => /téléphone 1|téléphone|phone|tel/i.test(h));
      if (phoneIdx < 0) phoneIdx = 3;
      const toImport: { name: string; email: string; phone: string | null }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        const email = String(cols[emailIdx] ?? cols[2] ?? "").trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
        let name: string;
        if (nameIdx >= 0 && cols[nameIdx]?.trim()) {
          name = String(cols[nameIdx]).trim().slice(0, 200);
        } else {
          const prenom = (cols[prenomIdx] ?? "").trim();
          const nom = (cols[nomIdx] ?? "").trim();
          name = [prenom, nom].filter(Boolean).join(" ") || email;
        }
        const phone = (cols[phoneIdx] ?? cols[3] ?? "").trim().replace(/^['"]|['"]$/g, "").slice(0, 50) || null;
        toImport.push({ name: name.slice(0, 200), email, phone });
      }
      if (toImport.length === 0) {
        setClientsError("No valid contacts with email found in CSV. Use columns: Name (or Prénom, Nom de famille), Email (or E-mail 1), Phone (or Téléphone).");
        return;
      }
      // Send full list in one request so the server can detect duplicates (existing clients are skipped; list is prioritized).
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ clients: toImport }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const serverMsg = typeof data?.details === "string" ? data.details : typeof data?.error === "string" ? data.error : "Import failed";
        throw new Error(serverMsg);
      }
      await fetchClients(token);
      setClientsError("");
      const imported = data.imported ?? 0;
      const skipped = data.skipped ?? 0;
      const msg =
        skipped > 0
          ? t("admin.clientsImportWithSkipped")
            .replace("{imported}", String(imported))
            .replace("{skipped}", String(skipped))
          : t("admin.clientsImportSuccess").replace("{count}", String(imported));
      setClientsMessage(msg);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("admin.clientsImportError");
      setClientsError(message);
    } finally {
      setImportingClients(false);
      e.target.value = "";
    }
  };

  const handleSyncReservationsToClients = async () => {
    if (!token) return;
    setSyncingReservationsToClients(true);
    setClientsError("");
    setClientsMessage(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ syncFromBookings: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Sync failed");
      await fetchClients(token);
      const count = data.synced ?? data.total ?? 0;
      setClientsMessage(t("admin.syncReservationsSuccess").replace("{count}", String(count)));
    } catch (err) {
      setClientsError(err instanceof Error ? err.message : t("admin.clientsImportError"));
    } finally {
      setSyncingReservationsToClients(false);
    }
  };

  const handleSyncFromResend = async () => {
    if (!token) return;
    setSyncingFromResend(true);
    setClientsError("");
    setClientsMessage(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ syncFromResend: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.details === "string" ? data.details : data?.error ?? "Sync failed");
      await fetchClients(token);
      if ((data.bookingsCreated ?? 0) > 0 || (data.bookingsUpdated ?? 0) > 0) await fetchBookings(token);
      const imported = data.imported ?? 0;
      const skipped = data.skipped ?? 0;
      const created = data.bookingsCreated ?? 0;
      const updated = data.bookingsUpdated ?? 0;
      let msg =
        skipped > 0
          ? t("admin.syncFromResendWithSkipped").replace("{imported}", String(imported)).replace("{skipped}", String(skipped))
          : t("admin.syncFromResendSuccess").replace("{count}", String(imported));
      if (created > 0 || updated > 0) {
        msg += " " + t("admin.syncFromResendBookings").replace("{created}", String(created)).replace("{updated}", String(updated));
      }
      setClientsMessage(msg);
    } catch (err) {
      setClientsError(err instanceof Error ? err.message : t("admin.clientsImportError"));
    } finally {
      setSyncingFromResend(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    if (!supabase) {
      setLoginError(t("admin.authNotConfigured"));
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoginError(error.message || t("admin.invalidCredentials"));
        return;
      }
      if (data.session?.access_token) {
        setToken(data.session.access_token);
        setEmail("");
        setPassword("");
      }
    } catch {
      setLoginError(t("admin.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setToken(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const data = JSON.parse(text);
        const list = Array.isArray(data) ? data : data.bookings ? data.bookings : [];
        const normalized = list.map((b: Record<string, unknown>) => ({
          name: String(b.name ?? ""),
          email: String(b.email ?? ""),
          phone: String(b.phone ?? ""),
          date: String(b.date ?? "").slice(0, 10),
          time: String(b.time ?? ""),
          partySize: Number(b.partySize) || 0,
          specialRequests: b.specialRequests != null ? String(b.specialRequests) : null,
          status: b.status != null ? String(b.status) : "confirmed",
        }));
        setImporting(true);
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: getAuthHeaders(token),
          body: JSON.stringify({ bookings: normalized }),
        });
        const result = await res.json().catch(() => ({}));
        if (res.ok) {
          await fetchBookings(token);
        } else {
          alert(result.error ?? "Import failed");
        }
      } catch {
        alert("Invalid JSON file");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSyncFromWix = async () => {
    if (!token) return;
    setSyncFromWixLoading(true);
    try {
      const res = await fetch("/api/bookings/sync-from-wix", {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchBookings(token);
        await fetchClients(token);
        const added = result.added ?? 0;
        toast.success(added > 0 ? t("admin.syncFromWixSuccess").replace("{count}", String(added)) : (result.message || t("admin.syncFromWixSuccessNone")));
      } else {
        toast.error(result.error ?? result.details ?? t("admin.syncFromWixError"));
      }
    } catch (err) {
      toast.error(t("admin.syncFromWixError"));
    } finally {
      setSyncFromWixLoading(false);
    }
  };

  const handleDeleteGuestPlaceholders = async () => {
    if (!token) return;
    setDeleteGuestPlaceholdersOpen(false);
    setDeleteGuestPlaceholdersLoading(true);
    try {
      const res = await fetch("/api/bookings/delete-guest-placeholders", {
        method: "POST",
        headers: getAuthHeaders(token),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchBookings(token);
        const deleted = result.deleted ?? 0;
        toast.success(deleted > 0 ? t("admin.deleteGuestPlaceholdersSuccess").replace("{count}", String(deleted)) : (result.message || t("admin.deleteGuestPlaceholdersNone")));
      } else {
        toast.error(result.error ?? t("admin.deleteGuestPlaceholdersError"));
      }
    } catch {
      toast.error(t("admin.deleteGuestPlaceholdersError"));
    } finally {
      setDeleteGuestPlaceholdersLoading(false);
    }
  };

  const handleSendConfirmationEmail = async (id: string) => {
    if (!token) return;
    setSendingConfirmationId(id);
    try {
      const res = await fetch("/api/bookings/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(token) },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(t("admin.sendConfirmationEmailSuccess"));
        if (bookingDetailId === id) {
          const detailRes = await fetch(`/api/bookings?id=${encodeURIComponent(id)}`, { headers: getAuthHeaders(token) });
          const detailData = await detailRes.json().catch(() => ({}));
          if (detailData.booking && Array.isArray(detailData.emailStatuses)) {
            setBookingDetail({ booking: detailData.booking, emailStatuses: detailData.emailStatuses });
          }
        }
      } else {
        toast.error(data.error ?? t("admin.sendConfirmationEmailError"));
      }
    } catch {
      toast.error(t("admin.sendConfirmationEmailError"));
    } finally {
      setSendingConfirmationId(null);
    }
  };

  const handleAccept = async (id: string) => {
    if (!token) return;
    setAcceptingId(id);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ id, status: "confirmed" }),
      });
      if (res.ok) {
        await fetchBookings(token);
        if (bookingDetailId === id) {
          const detailRes = await fetch(`/api/bookings?id=${encodeURIComponent(id)}`, { headers: getAuthHeaders(token) });
          const data = await detailRes.json().catch(() => ({}));
          if (data.booking && Array.isArray(data.emailStatuses)) {
            setBookingDetail({ booking: data.booking, emailStatuses: data.emailStatuses });
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? t("admin.fetchError"));
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    if (!token) return;
    setAcceptingId(id);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      if (res.ok) {
        await fetchBookings(token);
        setBookingDetailId(null);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? t("admin.fetchError"));
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    setArchivingId(id);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ id, status: "archived" }),
      });
      if (res.ok) {
        await fetchBookings(token);
        if (bookingDetailId === id) setBookingDetailId(null);
        else if (bookingDetailId) {
          const detailRes = await fetch(`/api/bookings?id=${encodeURIComponent(bookingDetailId)}`, { headers: getAuthHeaders(token) });
          const data = await detailRes.json().catch(() => ({}));
          if (data.booking && Array.isArray(data.emailStatuses)) {
            setBookingDetail({ booking: data.booking, emailStatuses: data.emailStatuses });
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? t("admin.fetchError"));
      }
    } finally {
      setArchivingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token || filteredPendingRequests.length === 0) return;
    setMarkAllArchiving(true);
    try {
      const res = await fetch("/api/bookings/bulk-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(token) },
        body: JSON.stringify({ ids: filteredPendingRequests.map((b) => b.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        await fetchBookings(token);
        setBookingDetailId(null);
        toast.success(data.archived ? t("admin.markAllAsRead") + ` (${data.archived})` : t("admin.markAllAsRead"));
      } else {
        toast.error(data?.error ?? t("admin.fetchError"));
      }
    } finally {
      setMarkAllArchiving(false);
    }
  };

  useEffect(() => {
    if (!bookingDetailId || !token) {
      setBookingDetail(null);
      setBookingDetailEditOpen(false);
      return;
    }
    setBookingDetailLoading(true);
    setBookingDetail(null);
    setBookingDetailEditOpen(false);
    fetch(`/api/bookings?id=${encodeURIComponent(bookingDetailId)}`, { headers: getAuthHeaders(token) })
      .then((r) => r.json())
      .then((data) => {
        if (data.booking && Array.isArray(data.emailStatuses)) {
          setBookingDetail({ booking: data.booking, emailStatuses: data.emailStatuses });
        }
      })
      .catch(() => setBookingDetail(null))
      .finally(() => setBookingDetailLoading(false));
  }, [bookingDetailId, token]);

  const openEditForm = () => {
    if (!bookingDetail) return;
    const rawParty = bookingDetail.booking.partySize || 2;
    const partySize = Math.min(20, Math.max(1, rawParty));
    setEditName(bookingDetail.booking.name ?? "");
    setEditEmail(bookingDetail.booking.email ?? "");
    setEditPhone(bookingDetail.booking.phone ?? "");
    setEditDate(bookingDetail.booking.date);
    setEditTime(bookingDetail.booking.time);
    setEditPartySize(partySize);
    setEditStatus((bookingDetail.booking.status as "confirmed" | "request" | "pending" | "cancelled" | "archived") || "confirmed");
    setBookingDetailEditOpen(true);
  };

  const handleSaveBookingEdit = async () => {
    if (!token || !bookingDetailId) return;
    setSavingBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          id: bookingDetailId,
          status: editStatus,
          name: editName,
          email: editEmail,
          phone: editPhone,
          date: editDate,
          time: editTime,
          party_size: editPartySize,
        }),
      });
      if (res.ok) {
        await fetchBookings(token);
        setBookingDetailEditOpen(false);
        const detailRes = await fetch(`/api/bookings?id=${encodeURIComponent(bookingDetailId)}`, { headers: getAuthHeaders(token) });
        const data = await detailRes.json().catch(() => ({}));
        if (data.booking && Array.isArray(data.emailStatuses)) {
          setBookingDetail({ booking: data.booking, emailStatuses: data.emailStatuses });
        }
        toast.success("Réservation mise à jour");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? "Erreur");
      }
    } finally {
      setSavingBooking(false);
    }
  };

  const [verified, setVerified] = useState<boolean | null>(null);
  useEffect(() => {
    if (!token) {
      setVerified(false);
      return;
    }
    verifyToken().then(setVerified);
  }, [token]);

  useEffect(() => {
    if (token && verified) fetchBookings(token);
  }, [token, verified, fetchBookings]);

  useEffect(() => {
    if (!token || !verified) return;
    if (deleteGuestPlaceholdersRanRef.current) return;
    deleteGuestPlaceholdersRanRef.current = true;
    fetch("/api/bookings/delete-guest-placeholders", { method: "POST", headers: getAuthHeaders(token) })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result.ok && result.deleted > 0) {
          fetchBookings(token);
          toast.success(t("admin.deleteGuestPlaceholdersSuccess").replace("{count}", String(result.deleted)));
        }
      })
      .catch(() => {});
  }, [token, verified, fetchBookings, t]);

  useEffect(() => {
    if (token && verified) fetchClients(token);
  }, [token, verified, fetchClients]);

  useEffect(() => {
    if (!token || !verified) return;
    const interval = setInterval(() => fetchBookings(token), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token, verified, fetchBookings]);

  const runWixSyncInBackground = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/bookings/sync-from-wix", { method: "POST", headers: getAuthHeaders(token) });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchBookings(token);
        await fetchClients(token);
      }
    } catch {
      // silent; manual sync button and toasts for user-initiated sync
    }
  }, [token, fetchBookings, fetchClients]);

  useEffect(() => {
    if (!token || !verified) return;
    const WIX_SYNC_INTERVAL_MS = 15 * 60 * 1000;
    const runOnce = () => {
      if (wixAutoSyncRanRef.current) return;
      wixAutoSyncRanRef.current = true;
      const t = setTimeout(() => {
        runWixSyncInBackground();
      }, 3000);
      return () => clearTimeout(t);
    };
    const cleanupOnce = runOnce();
    const interval = setInterval(runWixSyncInBackground, WIX_SYNC_INTERVAL_MS);
    return () => {
      cleanupOnce?.();
      clearInterval(interval);
    };
  }, [token, verified, runWixSyncInBackground]);

  // Subscribe to push notifications when admin logs in
  useEffect(() => {
    if (!token || !verified) return;
    
    console.log('[Admin] Attempting to subscribe to push notifications...');
    
    subscribeUserToPush(token).then((subscription) => {
      if (subscription) {
        console.log('[Admin] ✅ Successfully subscribed to push notifications');
        console.log('[Admin] Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
      } else {
        console.warn('[Admin] ⚠️ Push subscription returned null - check permissions');
      }
    }).catch((err) => {
      console.error('[Admin] ❌ Failed to subscribe to push:', err);
    });
  }, [token, verified]);

  const byDate = useMemo(() => {
    const map: Record<string, BookingRecord[]> = {};
    bookings.forEach((b) => {
      if (!b.date) return;
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    Object.keys(map).forEach((d) => map[d].sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [bookings]);

  /** Pending (request/pending status) count for the selected calendar date — used for Richieste badge. */
  const pendingCountForSelectedDate = useMemo(() => {
    const list = byDate[selectedCalendarDate] ?? [];
    return list.filter((b) => b.status === "request" || b.status === "pending").length;
  }, [byDate, selectedCalendarDate]);

  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const dayOfWeek = first.getDay();
    const mondayOffset = (dayOfWeek + 6) % 7;
    const start = new Date(year, month, 1 - mondayOffset);
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const day = d.getDate();
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: m === month,
      });
    }
    return days;
  }, [calendarMonth]);

  const sortedBookings = useMemo(() => {
    const list = [...bookings];
    if (bookingSort === "created") {
      list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    } else if (bookingSort === "date") {
      list.sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        return d !== 0 ? d : a.time.localeCompare(b.time);
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [bookings, bookingSort]);

  const specialRequestsBookings = useMemo(() => {
    return sortedBookings.filter(
      (b) => b.partySize >= 8 || (b.specialRequests != null && String(b.specialRequests).trim() !== "")
    );
  }, [sortedBookings]);

  /** All pending (request/pending status) for Richieste view in Calendar. */
  const pendingRequestsBookings = useMemo(() => {
    return sortedBookings.filter((b) => b.status === "request" || b.status === "pending");
  }, [sortedBookings]);

  /** Filtered and sorted list for Richieste (search, date filter, sort). */
  const filteredPendingRequests = useMemo(() => {
    let list = [...pendingRequestsBookings];
    const q = requestSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.email && b.email.toLowerCase().includes(q)) ||
          (b.phone && b.phone.includes(q))
      );
    }
    if (requestDateFilter) {
      list = list.filter((b) => b.date === requestDateFilter);
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (requestSort === "date") cmp = a.date.localeCompare(b.date);
      else if (requestSort === "time") cmp = (a.time || "").localeCompare(b.time || "");
      else if (requestSort === "name") cmp = a.name.localeCompare(b.name);
      else if (requestSort === "guests") cmp = a.partySize - b.partySize;
      return requestSortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [pendingRequestsBookings, requestSearch, requestDateFilter, requestSort, requestSortOrder]);

  if (verified === null) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-muted-foreground">{t("admin.loading")}</p>
      </div>
    );
  }

  if (!isSupabaseAuthConfigured()) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              {t("admin.authNotConfigured")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !verified) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.reservations")}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="admin-email">{t("admin.email")}</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="admin@spinella.ch"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="admin-password">{t("admin.password")}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder={t("admin.password")}
                  autoComplete="current-password"
                />
              </div>
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                <span>{loading ? t("admin.signingIn") : t("admin.logIn")}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-12 px-2 sm:px-4">
      <div className="container max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("admin.reservations")}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExportBookingsCsv} disabled={bookings.length === 0} className="flex-1 sm:flex-initial">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("admin.exportBookingsCsv")}</span>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleExportGuestsThisMonth} disabled={exportGuestsLoading} className="flex-1 sm:flex-initial" title={t("admin.exportGuestsThisMonthCsv")}>
              {exportGuestsLoading ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Download className="w-4 h-4 sm:mr-2" />}
              <span className="hidden sm:inline">{t("admin.exportGuestsThisMonthCsv")}</span>
            </Button>
            <label className="flex-1 sm:flex-initial">
              <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
              <Button type="button" variant="outline" size="sm" asChild disabled={importing} className="w-full">
                <span>
                  {importing ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Upload className="w-4 h-4 sm:mr-2" />}
                  <span className="hidden sm:inline">{t("admin.importJson")}</span>
                </span>
              </Button>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={handleSyncFromWix} disabled={syncFromWixLoading} className="flex-1 sm:flex-initial">
              {syncFromWixLoading ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : null}
              <span className="hidden sm:inline">{t("admin.syncFromWix")}</span>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteGuestPlaceholdersOpen(true)} disabled={deleteGuestPlaceholdersLoading} className="flex-1 sm:flex-initial">
              {deleteGuestPlaceholdersLoading ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 sm:mr-2" />}
              <span className="hidden sm:inline">{t("admin.deleteGuestPlaceholders")}</span>
            </Button>
            {userEmail && (
              <span className="text-xs sm:text-sm text-muted-foreground mr-2 hidden lg:inline">
                {t("admin.loggedInAs").replace("{email}", userEmail)}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("admin.logOut")}</span>
            </Button>
          </div>
        </div>

        {fetchError && <p className="text-sm text-destructive mb-4">{fetchError}</p>}
        <p className="text-sm text-muted-foreground mb-6">
          {t("admin.instructions")}
        </p>

        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              <List className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Toutes les réservations</span>
              <span className="sm:hidden">Toutes</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs sm:text-sm">
              <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Réservations du jour</span>
              <span className="sm:hidden">Jour</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm">
              <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("admin.calendar")}</span>
              <span className="sm:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("admin.clients")}</span>
              <span className="sm:hidden">Clients</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4 sm:mt-6">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    placeholder={t("admin.filterSearchPlaceholder")}
                    value={allReservationsSearch}
                    onChange={(e) => { setAllReservationsSearch(e.target.value); setAllReservationsPage(0); }}
                    className="pl-8 h-9"
                    aria-label={t("admin.filterSearchPlaceholder")}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectedBookingIds.size > 0 && (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {selectedBookingIds.size} sélectionnés
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBookingIds(new Set())}
                        className="h-7 text-xs"
                      >
                        Désélectionner
                      </Button>
                    </>
                  )}
                  {selectedBookingIds.size === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {allReservationsSearch.trim() ? `${allReservationsFiltered.length} / ${bookings.length}` : bookings.length} réservations
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const filteredIds = new Set(allReservationsFiltered.map((b) => b.id));
                      if (filteredIds.size > 0 && selectedBookingIds.size === filteredIds.size && allReservationsFiltered.every((b) => selectedBookingIds.has(b.id))) {
                        setSelectedBookingIds(new Set());
                      } else {
                        setSelectedBookingIds(new Set(allReservationsFiltered.map((b) => b.id)));
                      }
                    }}
                    className="h-8"
                  >
                    {allReservationsFiltered.length > 0 && selectedBookingIds.size === allReservationsFiltered.length && allReservationsFiltered.every((b) => selectedBookingIds.has(b.id)) ? <span>Désélectionner tout</span> : <span>Sélectionner tout</span>}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportBookingsCsv(selectedBookingIds.size > 0)}
                    disabled={bookings.length === 0}
                    className="h-8"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter {selectedBookingIds.size > 0 && <span>{`(${selectedBookingIds.size})`}</span>}
                  </Button>
                  <label>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleImportBookingsCsv}
                    />
                    <Button type="button" variant="outline" size="sm" asChild className="h-8">
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Importer CSV
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-muted-foreground">{t("admin.sortBy")}:</span>
                <Select 
                  value={allReservationsSort} 
                  onValueChange={(v: any) => {
                    setAllReservationsPage(0);
                    setAllReservationsSort(v);
                    if (v === "created") {
                      setAllReservationsSortOrder("desc");
                    } else if (v === "name") {
                      setAllReservationsSortOrder("asc");
                    } else {
                      setAllReservationsSortOrder("desc");
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Date de création (plus récent)</SelectItem>
                    <SelectItem value="date">Date de réservation (plus récent)</SelectItem>
                    <SelectItem value="name">Nom (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAllReservationsPage(0); setAllReservationsSortOrder(allReservationsSortOrder === "desc" ? "asc" : "desc"); }}
                  className="h-8 px-2"
                  title={allReservationsSortOrder === "desc" ? "Plus récent → Plus ancien" : "Plus ancien → Plus récent"}
                >
                  {allReservationsSortOrder === "desc" ? <span>↓</span> : <span>↑</span>}
                </Button>
              </div>
            </div>
            {bookings.length === 0 ? (
              <div className="p-4 sm:p-8 text-center text-sm text-muted-foreground">{t("admin.emptyList")}</div>
            ) : allReservationsFiltered.length === 0 ? (
              <div className="p-4 sm:p-8 text-center text-sm text-muted-foreground">{t("admin.noResultsForFilters")}</div>
            ) : (
              <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 sm:p-3 w-10">
                        <input
                          type="checkbox"
                          checked={allReservationsFiltered.length > 0 && allReservationsFiltered.every((b) => selectedBookingIds.has(b.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBookingIds(new Set(allReservationsFiltered.map((b) => b.id)));
                            } else {
                              setSelectedBookingIds(new Set());
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </th>
                      <th 
                        className="text-left p-2 sm:p-3 w-[80px] sm:w-auto cursor-pointer hover:bg-muted" 
                        onClick={() => {
                          if (allReservationsSort === "date") {
                            setAllReservationsSortOrder(allReservationsSortOrder === "desc" ? "asc" : "desc");
                          } else {
                            setAllReservationsSort("date");
                            setAllReservationsSortOrder("desc");
                          }
                        }}
                      >
                        {t("admin.date")} {allReservationsSort === "date" && (allReservationsSortOrder === "desc" ? <span>↓</span> : <span>↑</span>)}
                      </th>
                      <th className="text-left p-2 sm:p-3 w-[50px] sm:w-auto">{t("admin.time")}</th>
                      <th 
                        className="text-left p-2 sm:p-3 min-w-[100px] cursor-pointer hover:bg-muted" 
                        onClick={() => {
                          if (allReservationsSort === "name") {
                            setAllReservationsSortOrder(allReservationsSortOrder === "desc" ? "asc" : "desc");
                          } else {
                            setAllReservationsSort("name");
                            setAllReservationsSortOrder("asc");
                          }
                        }}
                      >
                        {t("admin.name")} {allReservationsSort === "name" && (allReservationsSortOrder === "desc" ? <span>↓</span> : <span>↑</span>)}
                      </th>
                      <th className="text-left p-2 sm:p-3 w-[40px]">{t("admin.guests")}</th>
                      <th className="text-left p-2 sm:p-3 w-[70px] sm:w-auto">{t("admin.status")}</th>
                      <th 
                        className="text-left p-2 sm:p-3 hidden md:table-cell cursor-pointer hover:bg-muted" 
                        onClick={() => {
                          if (allReservationsSort === "created") {
                            setAllReservationsSortOrder(allReservationsSortOrder === "desc" ? "asc" : "desc");
                          } else {
                            setAllReservationsSort("created");
                            setAllReservationsSortOrder("desc");
                          }
                        }}
                      >
                        Date de création {allReservationsSort === "created" && (allReservationsSortOrder === "desc" ? <span>↓</span> : <span>↑</span>)}
                      </th>
                      <th className="text-left p-2 sm:p-3 hidden lg:table-cell">{t("admin.phone")}</th>
                      <th className="text-left p-2 sm:p-3 hidden xl:table-cell">{t("admin.email")}</th>
                      <th className="text-left p-2 sm:p-3 w-[80px] sm:w-auto">{t("admin.action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReservationsPaginated.map((b) => (
                      <tr key={b.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 sm:p-3">
                          <input
                            type="checkbox"
                            checked={selectedBookingIds.has(b.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedBookingIds);
                              if (e.target.checked) {
                                newSelected.add(b.id);
                              } else {
                                newSelected.delete(b.id);
                              }
                              setSelectedBookingIds(newSelected);
                            }}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="p-2 sm:p-3 whitespace-nowrap text-[10px] sm:text-xs">{b.date}</td>
                        <td className="p-2 sm:p-3 whitespace-nowrap text-[10px] sm:text-xs">{b.time}</td>
                        <td className="p-2 sm:p-3 max-w-[120px] sm:max-w-none">
                          <span className="flex items-center gap-1.5">
                            {!(b.sentEmails?.length) && (
                              <MailX className="w-4 h-4 shrink-0 text-amber-600" title={t("admin.noEmailSent")} aria-label={t("admin.noEmailSent")} />
                            )}
                            {(b.sentEmails ?? []).some((e) => emailStatusByResendId[e.id] === "bounced") && (
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" title={t("admin.emailStatus_bounced")} aria-label={t("admin.emailStatus_bounced")} />
                            )}
                            <span className="truncate">{(b.email === "wix-sync@spinella.ch" || (b.name?.trim().toLowerCase() === "guest")) ? "—" : (b.name || "—")}</span>
                          </span>
                        </td>
                        <td className="p-2 sm:p-3">{b.partySize}</td>
                        <td className="p-2 sm:p-3">
                          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                            b.status === "confirmed" ? "bg-blue-600/20 text-blue-600" : b.status === "request" ? "bg-amber-600/20 text-amber-600" : b.status === "cancelled" ? "bg-red-600/20 text-red-600" : "bg-muted"
                          }`}>
                            {b.status === "request" ? <span>⚠</span> : b.status === "pending" ? <span>⏳</span> : b.status === "cancelled" ? <span>❌</span> : <span>✓</span>}
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 hidden md:table-cell text-[10px] sm:text-xs">
                          <span>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}</span>
                        </td>
                        <td className="p-2 sm:p-3 hidden lg:table-cell text-[10px] sm:text-xs">{b.phone}</td>
                        <td className="p-2 sm:p-3 hidden xl:table-cell text-[10px] sm:text-xs">{b.email === "wix-sync@spinella.ch" ? "—" : b.email}</td>
                        <td className="p-2 sm:p-3">
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setBookingDetailId(b.id)} title={t("admin.viewDetails")} className="p-1 h-auto">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(b.status === "pending" || b.status === "request") && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  disabled={acceptingId !== null}
                                  onClick={() => handleAccept(b.id)}
                                  className="p-1 sm:px-3 sm:py-2 h-auto"
                                  title={t("admin.accept")}
                                >
                                  {acceptingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 sm:mr-1" />}
                                  <span className="hidden sm:inline">{t("admin.accept")}</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={acceptingId !== null}
                                  onClick={() => handleDecline(b.id)}
                                  className="p-1 sm:px-3 sm:py-2 h-auto"
                                  title={t("admin.decline")}
                                >
                                  <X className="w-4 h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">{t("admin.decline")}</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {allReservationsSorted.length > PAGE_SIZE_RESERVATIONS && (
                <div className="flex items-center justify-between gap-2 mt-3 px-1">
                  <p className="text-xs text-muted-foreground">
                    {t("admin.page")} {allReservationsPage + 1} / {totalReservationsPages} ({allReservationsSorted.length} {t("admin.reservations").toLowerCase()})
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={allReservationsPage === 0} onClick={() => setAllReservationsPage((p) => Math.max(0, p - 1))}>
                      <ChevronLeft className="w-4 h-4" />
                      {t("admin.prev")}
                    </Button>
                    <Button variant="outline" size="sm" disabled={allReservationsPage >= totalReservationsPages - 1} onClick={() => setAllReservationsPage((p) => Math.min(totalReservationsPages - 1, p + 1))}>
                      {t("admin.next")}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </TabsContent>
          <TabsContent value="daily" className="mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <Label className="text-sm text-muted-foreground">{t("admin.date")}</Label>
              <Input
                type="date"
                value={dailyListDate}
                onChange={(e) => setDailyListDate(e.target.value)}
                className="w-full sm:w-[180px]"
              />
              <span className="text-sm text-muted-foreground">
                {bookings.filter((b) => b.date === dailyListDate).length} {t("admin.reservations").toLowerCase()}
              </span>
            </div>
            <Card>
              <CardContent className="p-0">
                {(() => {
                  const dailyBookings = bookings
                    .filter((b) => b.date === dailyListDate)
                    .sort((a, b) => a.time.localeCompare(b.time));
                  if (dailyBookings.length === 0) {
                    return (
                      <div className="p-4 sm:p-8 text-center text-sm text-muted-foreground">
                        Aucune réservation pour cette date.
                      </div>
                    );
                  }
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2 sm:p-3 w-[50px]">{t("admin.time")}</th>
                            <th className="text-left p-2 sm:p-3 min-w-[100px]">{t("admin.name")}</th>
                            <th className="text-left p-2 sm:p-3 w-[40px]">{t("admin.guests")}</th>
                            <th className="text-left p-2 sm:p-3 w-[70px]">{t("admin.status")}</th>
                            <th className="text-left p-2 sm:p-3 w-[80px]">{t("admin.action")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyBookings.map((b) => (
                            <tr key={b.id} className="border-b hover:bg-muted/30">
                              <td className="p-2 sm:p-3 whitespace-nowrap">{b.time}</td>
                              <td className="p-2 sm:p-3 max-w-[140px]">
                                <span className="flex items-center gap-1.5 truncate">
                                  {!(b.sentEmails?.length) && (
                                    <MailX className="w-4 h-4 shrink-0 text-amber-600" title={t("admin.noEmailSent")} aria-label={t("admin.noEmailSent")} />
                                  )}
                                  {(b.sentEmails ?? []).some((e) => emailStatusByResendId[e.id] === "bounced") && (
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" title={t("admin.emailStatus_bounced")} aria-label={t("admin.emailStatus_bounced")} />
                                  )}
                                  <span className="truncate">{(b.email === "wix-sync@spinella.ch" || (b.name?.trim().toLowerCase() === "guest")) ? "—" : (b.name || "—")}</span>
                                </span>
                              </td>
                              <td className="p-2 sm:p-3">{b.partySize}</td>
                              <td className="p-2 sm:p-3">
                                <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                                  b.status === "confirmed" ? "bg-blue-600/20 text-blue-600" : b.status === "request" ? "bg-amber-600/20 text-amber-600" : b.status === "cancelled" ? "bg-red-600/20 text-red-600" : "bg-muted"
                                }`}>
                                  {b.status === "request" ? <span>⚠</span> : b.status === "pending" ? <span>⏳</span> : b.status === "cancelled" ? <span>❌</span> : <span>✓</span>}
                                  {b.status === "request" ? t("admin.statusRequest") : b.status === "pending" ? t("admin.statusPending") : b.status === "cancelled" ? t("admin.statusCancelled") : b.status === "archived" ? t("admin.statusArchived") : t("admin.statusConfirmed")}
                                </span>
                              </td>
                              <td className="p-2 sm:p-3">
                                <Button size="sm" variant="ghost" onClick={() => setBookingDetailId(b.id)} title={t("admin.viewDetails")} className="p-1 h-auto">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {(b.status === "pending" || b.status === "request") && (
                                  <>
                                    <Button size="sm" variant="default" disabled={acceptingId !== null} onClick={() => handleAccept(b.id)} className="p-1 sm:px-2 h-auto ml-1" title={t("admin.accept")}>
                                      {acceptingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </Button>
                                    <Button size="sm" variant="destructive" disabled={acceptingId !== null} onClick={() => handleDecline(b.id)} className="p-1 h-auto ml-1" title={t("admin.decline")}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {/* Two Tabs: Prenotazioni (All) and Richieste (Requests Only) */}
                <div className="flex gap-2 border-b px-4 pt-4">
                  <button
                    onClick={() => setCalendarView("all")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      calendarView === "all"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("admin.reservations")}
                  </button>
                  <button
                    onClick={() => setCalendarView("requests")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                      calendarView === "requests"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("admin.requests")}
                    {pendingRequestsBookings.length > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                        {pendingRequestsBookings.length}
                      </span>
                    )}
                  </button>
                </div>

                {calendarView === "requests" ? (
                  /* Richieste: all pending requests with filters */
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("admin.requestsIntro")}
                    </p>
                    {pendingRequestsBookings.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">{t("admin.emptyRequests")}</div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg bg-muted/40 border border-border">
                          <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder={t("admin.filterSearchPlaceholder")}
                              value={requestSearch}
                              onChange={(e) => setRequestSearch(e.target.value)}
                              className="pl-8 h-9"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="request-date-filter" className="text-xs text-muted-foreground whitespace-nowrap">
                              {t("admin.date")}:
                            </Label>
                            <input
                              id="request-date-filter"
                              type="date"
                              value={requestDateFilter}
                              onChange={(e) => setRequestDateFilter(e.target.value)}
                              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            />
                            {requestDateFilter && (
                              <Button type="button" variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setRequestDateFilter("")}>
                                {t("admin.filterDateAll")}
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">{t("admin.sortBy")}:</Label>
                            <Select value={requestSort} onValueChange={(v: "date" | "time" | "name" | "guests") => setRequestSort(v)}>
                              <SelectTrigger className="w-[140px] h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="date">{t("admin.sortByRequestedDate")}</SelectItem>
                                <SelectItem value="time">{t("admin.sortByTime")}</SelectItem>
                                <SelectItem value="name">{t("admin.name")}</SelectItem>
                                <SelectItem value="guests">{t("admin.sortByGuests")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 px-2"
                              onClick={() => setRequestSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                              title={requestSortOrder === "asc" ? "Ascending" : "Descending"}
                            >
                              {requestSortOrder === "asc" ? "↑" : "↓"}
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {filteredPendingRequests.length} / {pendingRequestsBookings.length}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9"
                            disabled={markAllArchiving || filteredPendingRequests.length === 0}
                            onClick={handleMarkAllAsRead}
                            title={t("admin.markAllAsRead")}
                          >
                            {markAllArchiving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {t("admin.markAllAsRead")}
                          </Button>
                        </div>
                        {filteredPendingRequests.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">{t("admin.noResultsForFilters")}</div>
                        ) : (
                          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-muted/80 z-10">
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left p-3">{t("admin.date")}</th>
                                  <th className="text-left p-3">{t("admin.time")}</th>
                                  <th className="text-left p-3">{t("admin.name")}</th>
                                  <th className="text-left p-3">{t("admin.guests")}</th>
                                  <th className="text-left p-3">{t("admin.status")}</th>
                                  <th className="text-left p-3">{t("admin.specialRequests")}</th>
                                  <th className="text-left p-3 w-24">{t("admin.action")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPendingRequests.map((b) => (
                                  <tr key={b.id} className="border-b">
                                    <td className="p-3">{b.date}</td>
                                    <td className="p-3">{b.time}</td>
                                    <td className="p-3">
                                      <span className="flex items-center gap-1.5">
                                        {!(b.sentEmails?.length) && (
                                          <MailX className="w-4 h-4 shrink-0 text-amber-600" title={t("admin.noEmailSent")} aria-label={t("admin.noEmailSent")} />
                                        )}
                                        {(b.sentEmails ?? []).some((e) => emailStatusByResendId[e.id] === "bounced") && (
                                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" title={t("admin.emailStatus_bounced")} aria-label={t("admin.emailStatus_bounced")} />
                                        )}
                                        {(b.email === "wix-sync@spinella.ch" || (b.name?.trim().toLowerCase() === "guest")) ? "—" : (b.name || "—")}
                                      </span>
                                    </td>
                                    <td className="p-3">{b.partySize}</td>
                                    <td className="p-3">
                                      <span className={b.status === "request" ? "text-amber-600" : "text-muted-foreground"}>
                                        {b.status === "request" ? t("admin.statusRequest") : t("admin.statusPending")}
                                      </span>
                                    </td>
                                    <td className="p-3 max-w-[200px] truncate" title={b.specialRequests ?? ""}>
                                      {b.specialRequests?.trim() || "—"}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <Button size="sm" variant="ghost" onClick={() => setBookingDetailId(b.id)} title={t("admin.viewDetails")}>
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          disabled={acceptingId !== null || archivingId !== null}
                                          onClick={() => handleAccept(b.id)}
                                        >
                                          {acceptingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                                          {t("admin.accept")}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={acceptingId !== null || archivingId !== null}
                                          onClick={() => handleMarkAsRead(b.id)}
                                          title={t("admin.markAsRead")}
                                        >
                                          {archivingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                          {t("admin.markAsRead")}
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <>
                {/* Calendar: single-date view with date picker and month strip */}
                <div className="border-b p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                          setCalendarMonth(newMonth);
                          const newDate = `${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, "0")}-01`;
                          setSelectedCalendarDate(newDate);
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium capitalize min-w-[140px] text-center">
                        {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                          setCalendarMonth(newMonth);
                          const newDate = `${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, "0")}-01`;
                          setSelectedCalendarDate(newDate);
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <Label htmlFor="admin-calendar-date" className="text-xs text-muted-foreground sr-only sm:not-sr-only sm:mr-2">
                      Aller au
                    </Label>
                    <Input
                      id="admin-calendar-date"
                      type="date"
                      value={selectedCalendarDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        setSelectedCalendarDate(v);
                        const d = parseLocalDate(v);
                        setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                      }}
                      className="w-[140px] h-8 text-sm"
                    />
                  </div>

                  {/* Date Strip - 7 days centered around selected date */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {(() => {
                      const selected = parseLocalDate(selectedCalendarDate);
                      const startDate = new Date(selected);
                      startDate.setDate(startDate.getDate() - 3); // Show 3 days before
                      
                      return Array.from({ length: 7 }, (_, i) => {
                        const date = new Date(startDate);
                        date.setDate(date.getDate() + i);
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                        const isSelected = dateStr === selectedCalendarDate;
                        const dayBookings = calendarView === "all" 
                          ? (byDate[dateStr] ?? [])
                          : (byDate[dateStr] ?? []).filter(b => b.status === "request" || b.status === "pending");
                        const hasBookings = dayBookings.length > 0;
                        
                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedCalendarDate(dateStr)}
                            className={`flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-lg transition-colors ${
                              isSelected 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-muted"
                            }`}
                          >
                            <span className="text-xs uppercase mb-1">
                              {date.toLocaleDateString(undefined, { weekday: "short" })}
                            </span>
                            <span className="text-lg font-semibold">{date.getDate()}</span>
                            {hasBookings && !isSelected && (
                              <div className="w-1 h-1 rounded-full bg-primary mt-1" />
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* List: only the selected date (single-day view) */}
                <div className="max-h-[600px] overflow-y-auto">
                  {(() => {
                    const dateStr = selectedCalendarDate;
                    const dayBookings = calendarView === "all"
                      ? (byDate[dateStr] ?? [])
                      : (byDate[dateStr] ?? []).filter((b) => b.status === "request" || b.status === "pending");
                    const totalGuests = dayBookings.reduce((sum, b) => sum + b.partySize, 0);
                    const date = parseLocalDate(dateStr);

                    return (
                      <div key={dateStr} id={`date-${dateStr}`}>
                        {/* Date Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-primary/10">
                            <span className="text-sm font-medium">
                              {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {dayBookings.length}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {totalGuests}
                              </span>
                            </div>
                          </div>

                        {/* Bookings for this date only */}
                        {dayBookings.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            <span>{calendarView === "all" ? t("admin.emptyList") : t("admin.emptySpecial")}</span>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {dayBookings.map((b) => (
                              <div
                                key={b.id}
                                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="font-medium text-sm whitespace-nowrap">{b.time}</span>
                                  {!(b.sentEmails?.length) && (
                                    <MailX className="w-4 h-4 shrink-0 text-amber-600" title={t("admin.noEmailSent")} aria-label={t("admin.noEmailSent")} />
                                  )}
                                  {(b.sentEmails ?? []).some((e) => emailStatusByResendId[e.id] === "bounced") && (
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" title={t("admin.emailStatus_bounced")} aria-label={t("admin.emailStatus_bounced")} />
                                  )}
                                  <span className="text-sm truncate">{(b.email === "wix-sync@spinella.ch" || (b.name?.trim().toLowerCase() === "guest")) ? "—" : (b.name || "—")}</span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {b.partySize}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                                    b.status === "confirmed"
                                      ? "bg-blue-600/20 text-blue-600"
                                      : b.status === "request" || b.status === "pending"
                                        ? "bg-amber-600/20 text-amber-600"
                                        : b.status === "cancelled"
                                          ? "bg-red-600/20 text-red-600"
                                          : "bg-muted text-muted-foreground"
                                  }`}>
                                    {b.status === "confirmed"
                                      ? "Prenotato"
                                      : b.status === "request" || b.status === "pending"
                                        ? "In attesa"
                                        : b.status === "cancelled"
                                          ? "Annullato"
                                          : b.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setBookingDetailId(b.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {(b.status === "request" || b.status === "pending") && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleAccept(b.id)}
                                      disabled={acceptingId !== null}
                                      className="h-8 px-3"
                                    >
                                      {acceptingId === b.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="clients" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {selectedClientIds.size > 0 && (
                        <>
                          <span className="text-sm text-muted-foreground">
                            {selectedClientIds.size} sélectionnés
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedClientIds(new Set())}
                            className="h-7 text-xs"
                          >
                            Désélectionner
                          </Button>
                        </>
                      )}
                      {selectedClientIds.size === 0 && (
                        <p className="text-sm text-muted-foreground">
                          {clients.length === 0
                            ? t("admin.emptyClients")
                            : `${filteredAndSortedClients.length} / ${clients.length} ${t("admin.clients").toLowerCase()}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedClientIds.size === filteredAndSortedClients.length) {
                            setSelectedClientIds(new Set());
                          } else {
                            setSelectedClientIds(new Set(filteredAndSortedClients.map(c => c.id)));
                          }
                        }}
                        className="h-8"
                      >
                        {selectedClientIds.size === filteredAndSortedClients.length ? <span>Désélectionner tout</span> : <span>Sélectionner tout</span>}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportCsv(selectedClientIds.size > 0)}
                        disabled={clients.length === 0}
                        className="h-8"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter {selectedClientIds.size > 0 && <span>{`(${selectedClientIds.size})`}</span>}
                      </Button>
                      <label>
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleImportCsvClients}
                          disabled={importingClients}
                        />
                        <Button type="button" variant="outline" size="sm" asChild disabled={importingClients}>
                          <span>
                            {importingClients ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            Importer CSV
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setAddClientOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t("admin.addClient")}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setAddFromListOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t("admin.addFromList")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSyncFromResend}
                      disabled={syncingFromResend}
                      title={t("admin.syncFromResend")}
                    >
                      {syncingFromResend ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      <span>{syncingFromResend ? t("admin.syncingFromResend") : t("admin.syncFromResend")}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSyncReservationsToClients}
                      disabled={syncingReservationsToClients}
                    >
                      {syncingReservationsToClients ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                      <span>{syncingReservationsToClients ? t("admin.syncingReservationsToClients") : t("admin.syncReservationsToClients")}</span>
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-4">
                  <Input
                    type="search"
                    placeholder={t("admin.searchClients")}
                    value={clientSearch}
                    onChange={(e) => { setClientSearch(e.target.value); setClientsPage(0); }}
                    className="max-w-xs"
                  />
                  <Select value={clientSort} onValueChange={(v) => { setClientsPage(0); setClientSort(v as "name" | "email" | "date"); }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t("admin.sortBy")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">{t("admin.sortByDate")}</SelectItem>
                      <SelectItem value="name">{t("admin.sortByName")}</SelectItem>
                      <SelectItem value="email">{t("admin.sortByAlphabet")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {clientsMessage && <p className="text-sm text-green-600 mb-4">{clientsMessage}</p>}
                {clientsError && <p className="text-sm text-destructive mb-4">{clientsError}</p>}
                {clients.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">{t("admin.emptyClients")}</div>
                ) : filteredAndSortedClients.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <span>{clientSearch.trim() ? "No clients match your search." : t("admin.emptyClients")}</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 w-10">
                            <input
                              type="checkbox"
                              checked={selectedClientIds.size === filteredAndSortedClients.length && filteredAndSortedClients.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClientIds(new Set(filteredAndSortedClients.map(c => c.id)));
                                } else {
                                  setSelectedClientIds(new Set());
                                }
                              }}
                              className="cursor-pointer"
                            />
                          </th>
                          <th className="text-left p-3 w-14">{t("admin.rank")}</th>
                          <th className="text-left p-3">{t("admin.name")}</th>
                          <th className="text-left p-3">{t("admin.email")}</th>
                          <th className="text-left p-3">{t("admin.phone")}</th>
                          <th className="text-left p-3">{t("admin.lastBooked")}</th>
                          <th className="text-left p-3">{t("admin.source")}</th>
                          <th className="text-left p-3 w-20">{t("admin.action")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientsPaginated.map((c, index) => (
                          <tr key={c.id} className="border-b hover:bg-muted/30">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedClientIds.has(c.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedClientIds);
                                  if (e.target.checked) {
                                    newSelected.add(c.id);
                                  } else {
                                    newSelected.delete(c.id);
                                  }
                                  setSelectedClientIds(newSelected);
                                }}
                                className="cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-muted-foreground tabular-nums">{clientsPage * PAGE_SIZE_CLIENTS + index + 1}</td>
                            <td className="p-3">{c.name}</td>
                            <td className="p-3">{c.email}</td>
                            <td className="p-3">{c.phone ?? "—"}</td>
                            <td className="p-3 text-muted-foreground">
                              {c.lastBookingDate
                                ? new Date(c.lastBookingDate + "T12:00:00").toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td className="p-3 text-muted-foreground">{c.source}</td>
                            <td className="p-3">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                disabled={deletingClientId !== null}
                                onClick={() => setDeleteClientId(c.id)}
                              >
                                {deletingClientId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                <span className="sr-only">{t("admin.deleteClient")}</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {filteredAndSortedClients.length > PAGE_SIZE_CLIENTS && (
                  <div className="flex items-center justify-between gap-2 mt-3 px-4 pb-4">
                    <p className="text-xs text-muted-foreground">
                      {t("admin.page")} {clientsPage + 1} / {totalClientsPages} ({filteredAndSortedClients.length} clients)
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={clientsPage === 0} onClick={() => setClientsPage((p) => Math.max(0, p - 1))}>
                        <ChevronLeft className="w-4 h-4" />
                        {t("admin.prev")}
                      </Button>
                      <Button variant="outline" size="sm" disabled={clientsPage >= totalClientsPages - 1} onClick={() => setClientsPage((p) => Math.min(totalClientsPages - 1, p + 1))}>
                        {t("admin.next")}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("admin.addClient")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddClient} className="space-y-4">
                  <div>
                    <Label htmlFor="add-client-name">{t("admin.name")}</Label>
                    <Input
                      id="add-client-name"
                      value={addClientName}
                      onChange={(e) => setAddClientName(e.target.value)}
                      placeholder={t("admin.name")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-client-email">{t("admin.email")} *</Label>
                    <Input
                      id="add-client-email"
                      type="email"
                      value={addClientEmail}
                      onChange={(e) => setAddClientEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-client-phone">{t("admin.phone")}</Label>
                    <Input
                      id="add-client-phone"
                      value={addClientPhone}
                      onChange={(e) => setAddClientPhone(e.target.value)}
                      placeholder={t("admin.phone")}
                      className="mt-1"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddClientOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={savingClient}>
                      {savingClient ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      <span>{savingClient ? "..." : t("admin.addClient")}</span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={addFromListOpen} onOpenChange={setAddFromListOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("admin.addFromList")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddFromList} className="space-y-4">
                  <div>
                    <Label htmlFor="add-from-list-text">{t("admin.addFromListPlaceholder")}</Label>
                    <Textarea
                      id="add-from-list-text"
                      value={addFromListText}
                      onChange={(e) => setAddFromListText(e.target.value)}
                      placeholder="John Doe, john@example.com, +41 22 123 45 67"
                      rows={8}
                      className="mt-2 font-mono text-sm"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddFromListOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addFromListSaving || !addFromListText.trim()}>
                      {addFromListSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      <span>{addFromListSaving ? "..." : t("admin.addFromListSubmit")}</span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <AlertDialog open={deleteClientId !== null} onOpenChange={(open) => !open && setDeleteClientId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("admin.deleteClient")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("admin.confirmDeleteClient")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteClientId && handleDeleteClient(deleteClientId)}
                  >
                    {t("admin.deleteClient")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={deleteGuestPlaceholdersOpen} onOpenChange={setDeleteGuestPlaceholdersOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("admin.deleteGuestPlaceholders")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("admin.deleteGuestPlaceholdersConfirm")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteGuestPlaceholders();
                    }}
                  >
                    {t("admin.deleteGuestPlaceholders")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>

        {/* Booking Detail Dialog - accessible from all tabs. Key avoids NotFoundError removeChild when switching bookings. */}
        <Dialog
          key={bookingDetailId ?? "closed"}
          open={!!bookingDetailId}
          onOpenChange={(open) => {
            if (!open) {
              setBookingDetailId(null);
              setBookingDetailEditOpen(false);
            }
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                <span>{bookingDetailEditOpen ? modalLabels.modifyReservation : t("admin.reservationDetails")}</span>
              </DialogTitle>
            </DialogHeader>
            {bookingDetailLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : bookingDetail ? (
              bookingDetailEditOpen ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("admin.name")}</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t("admin.name")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.email")}</Label>
                    <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.phone")}</Label>
                    <Input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder={t("admin.phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.guests")}</Label>
                    <Select
                      value={ALLOWED_PARTY_SIZES.includes(editPartySize) ? String(editPartySize) : String(ALLOWED_PARTY_SIZES[0])}
                      onValueChange={(v) => setEditPartySize(parseInt(v, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOWED_PARTY_SIZES.map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.date")}</Label>
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => {
                        setEditDate(e.target.value);
                        const slots = getTimeSlotsForDate(e.target.value);
                        if (slots.length && !slots.includes(editTime)) setEditTime(slots[0]);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.time")}</Label>
                    <Select
                      value={(() => {
                        const slots = editDate ? getTimeSlotsForDate(editDate) : [];
                        const options = slots.length ? (slots.includes(editTime) ? slots : [...slots, editTime].sort()) : (editTime ? [editTime] : []);
                        const safeValue = options.length && (options.includes(editTime) ? editTime : options[0]);
                        return safeValue ?? "";
                      })()}
                      onValueChange={setEditTime}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const slots = editDate ? getTimeSlotsForDate(editDate) : [];
                          const options = slots.length ? (slots.includes(editTime) ? slots : [...slots, editTime].sort()) : (editTime ? [editTime] : []);
                          if (options.length === 0) {
                            return <SelectItem value="" disabled>—</SelectItem>;
                          }
                          return options.map((slot) => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.status")}</Label>
                    <Select value={editStatus} onValueChange={(v) => setEditStatus(v as typeof editStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">{t("admin.statusConfirmed")}</SelectItem>
                        <SelectItem value="request">{t("admin.statusRequest")}</SelectItem>
                        <SelectItem value="pending">{t("admin.statusPending")}</SelectItem>
                        <SelectItem value="cancelled">{t("admin.statusCancelled")}</SelectItem>
                        <SelectItem value="archived">{t("admin.statusArchived")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBookingDetailEditOpen(false)} disabled={savingBooking}>
                      {modalLabels.cancelEdit}
                    </Button>
                    <Button onClick={handleSaveBookingEdit} disabled={savingBooking}>
                      {savingBooking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {modalLabels.saveReservation}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">{t("admin.date")}</span>
                    <span>{bookingDetail.booking.date}</span>
                    <span className="text-muted-foreground">{t("admin.time")}</span>
                    <span>{bookingDetail.booking.time}</span>
                    <span className="text-muted-foreground">{t("admin.name")}</span>
                    <span>{bookingDetail.booking.name}</span>
                    <span className="text-muted-foreground">{t("admin.email")}</span>
                    <span>{bookingDetail.booking.email}</span>
                    <span className="text-muted-foreground">{t("admin.phone")}</span>
                    <span>{bookingDetail.booking.phone}</span>
                    <span className="text-muted-foreground">{t("admin.guests")}</span>
                    <span>{bookingDetail.booking.partySize}</span>
                    <span className="text-muted-foreground">{t("admin.status")}</span>
                    <span className={`font-semibold ${
                      bookingDetail.booking.status === "confirmed" 
                        ? "text-green-600" 
                        : bookingDetail.booking.status === "request" || bookingDetail.booking.status === "pending"
                          ? "text-amber-600"
                          : bookingDetail.booking.status === "cancelled"
                            ? "text-red-600"
                            : bookingDetail.booking.status === "archived"
                              ? "text-muted-foreground"
                              : ""
                    }`}>
                      {bookingDetail.booking.status === "request"
                        ? <span>{t("admin.statusRequest")}</span>
                        : bookingDetail.booking.status === "confirmed"
                          ? <span>{t("admin.statusConfirmed")}</span>
                          : bookingDetail.booking.status === "cancelled"
                            ? <span>{t("admin.statusCancelled")}</span>
                            : bookingDetail.booking.status === "archived"
                              ? <span>{t("admin.statusArchived")}</span>
                              : <span>{t("admin.statusPending")}</span>}
                    </span>
                  </div>
                  {bookingDetail.booking.specialRequests && (
                    <>
                      <span className="text-sm text-muted-foreground">{t("admin.specialRequests")}</span>
                      <p className="text-sm">{bookingDetail.booking.specialRequests}</p>
                    </>
                  )}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">{t("admin.emailsSentTitle")}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{t("admin.emailsSentDesc")}</p>
                    {bookingDetail.emailStatuses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("admin.noEmailsSent")}</p>
                    ) : (
                      <table className="w-full text-sm border rounded">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2 font-medium">{t("admin.emailTypeHeader")}</th>
                            <th className="text-left p-2 font-medium">{t("admin.sentAtHeader")}</th>
                            <th className="text-left p-2 font-medium">{t("admin.deliveryStatusHeader")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookingDetail.emailStatuses.map((e) => (
                            <tr key={e.id} className="border-b">
                              <td className="p-2">{t(`admin.emailType_${e.type}`) || e.type}</td>
                              <td className="p-2"><span>{e.sentAt ? new Date(e.sentAt).toLocaleString() : "—"}</span></td>
                              <td className="p-2">
                                <span className={e.status === "delivered" ? "text-green-600" : e.status === "bounced" || e.status === "failed" ? "text-red-600 font-semibold" : e.status === "opened" || e.status === "clicked" ? "text-blue-600" : ""}>
                                  {e.status === "bounced" ? "⚠ " : ""}{t(`admin.emailStatus_${e.status ?? "sent"}`)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <DialogFooter className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={openEditForm}>
                      <Pencil className="w-4 h-4 mr-2" />
                      {modalLabels.modify}
                    </Button>
                    {bookingDetail.booking.email?.trim() && (
                      <Button
                        variant="outline"
                        onClick={() => handleSendConfirmationEmail(bookingDetail.booking.id)}
                        disabled={sendingConfirmationId !== null}
                      >
                        {sendingConfirmationId === bookingDetail.booking.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4 mr-2" />
                        )}
                        {t("admin.sendConfirmationEmail")}
                      </Button>
                    )}
                    {(bookingDetail.booking.status === "request" || bookingDetail.booking.status === "pending") && (
                      <>
                        <Button
                          variant="default"
                          onClick={() => handleAccept(bookingDetail.booking.id)}
                          disabled={acceptingId !== null || archivingId !== null}
                        >
                          {acceptingId === bookingDetail.booking.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          {t("admin.accept")}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDecline(bookingDetail.booking.id)}
                          disabled={acceptingId !== null || archivingId !== null}
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t("admin.decline")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleMarkAsRead(bookingDetail.booking.id)}
                          disabled={acceptingId !== null || archivingId !== null}
                          title={t("admin.markAsRead")}
                        >
                          {archivingId === bookingDetail.booking.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          {t("admin.markAsRead")}
                        </Button>
                      </>
                    )}
                  </DialogFooter>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

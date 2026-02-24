import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

const STORAGE_CONSENT = "spinella_privacy_consent";
const STORAGE_NEWSLETTER_SHOWN = "spinella_newsletter_shown";

export function ConsentNewsletterPopups() {
  const { t } = useLanguage();
  const [consentOpen, setConsentOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success" | "error">("idle");

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setNewsletterStatus("success");
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_NEWSLETTER_SHOWN, "1");
      }
    },
    onError: () => setNewsletterStatus("error"),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const consent = localStorage.getItem(STORAGE_CONSENT);
    const newsletterShown = localStorage.getItem(STORAGE_NEWSLETTER_SHOWN);
    if (consent !== "accepted" && consent !== "declined") {
      setConsentOpen(true);
    } else if (consent === "accepted" && !newsletterShown) {
      setNewsletterOpen(true);
    }
  }, [mounted]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_CONSENT, "accepted");
    setConsentOpen(false);
    if (typeof localStorage !== "undefined" && !localStorage.getItem(STORAGE_NEWSLETTER_SHOWN)) {
      setNewsletterOpen(true);
    }
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_CONSENT, "declined");
    setConsentOpen(false);
  };

  const handleNewsletterSkip = () => {
    localStorage.setItem(STORAGE_NEWSLETTER_SHOWN, "1");
    setNewsletterOpen(false);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    subscribeMutation.mutate({ email: trimmed });
  };

  if (!mounted) return null;

  return (
    <>
      {/* Privacy consent – must accept or decline, no close on overlay */}
      <Dialog open={consentOpen} onOpenChange={(open) => !open && setConsentOpen(false)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md border-[oklch(0.62_0.15_85/0.4)] bg-[oklch(0.16_0.005_85)] text-[oklch(0.92_0.02_85)]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="gold-text text-xl font-semibold">
              {t("consent.title")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              {t("consent.message")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              className="border-[oklch(0.62_0.15_85/0.6)] text-foreground hover:bg-[oklch(0.62_0.15_85/0.15)]"
              onClick={handleDecline}
            >
              {t("consent.decline")}
            </Button>
            <Button
              type="button"
              className="gold-bg text-black hover:bg-[oklch(0.52_0.15_85)] font-semibold"
              onClick={handleAccept}
            >
              {t("consent.accept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Newsletter – optional, can skip */}
      <Dialog open={newsletterOpen} onOpenChange={setNewsletterOpen}>
        <DialogContent
          className="max-w-md border-[oklch(0.62_0.15_85/0.4)] bg-[oklch(0.16_0.005_85)] text-[oklch(0.92_0.02_85)]"
          onCloseAutoFocus={() => setNewsletterStatus("idle")}
        >
          <DialogHeader>
            <DialogTitle className="gold-text text-xl font-semibold">
              {t("newsletter.title")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              {t("newsletter.message")}
            </DialogDescription>
          </DialogHeader>
          {newsletterStatus === "success" ? (
            <p className="text-sm gold-text font-medium py-2">{t("newsletter.success")}</p>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="space-y-4 mt-2">
              <Input
                type="email"
                placeholder={t("newsletter.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border"
                disabled={subscribeMutation.isPending}
                autoComplete="email"
              />
              {newsletterStatus === "error" && (
                <p className="text-sm text-destructive">{t("newsletter.error")}</p>
              )}
              <DialogFooter className="flex gap-3 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[oklch(0.62_0.15_85/0.6)] text-foreground hover:bg-[oklch(0.62_0.15_85/0.15)]"
                  onClick={handleNewsletterSkip}
                >
                  {t("newsletter.skip")}
                </Button>
                <Button
                  type="submit"
                  className="gold-bg text-black hover:bg-[oklch(0.52_0.15_85)] font-semibold"
                  disabled={subscribeMutation.isPending || !email.trim()}
                >
                  {subscribeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("newsletter.subscribe")
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
          {newsletterStatus === "success" && (
            <Button
              type="button"
              className="gold-bg text-black hover:bg-[oklch(0.52_0.15_85)] font-semibold w-full mt-2"
              onClick={() => setNewsletterOpen(false)}
            >
              OK
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

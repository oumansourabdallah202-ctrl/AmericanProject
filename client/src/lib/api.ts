export function getApiUrl(path: string) {
  const base = import.meta.env.VITE_API_URL?.trim();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base.replace(/\/+$/, "")}${normalized}` : normalized;
}

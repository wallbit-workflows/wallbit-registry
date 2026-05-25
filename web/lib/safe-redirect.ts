/** Prevent Clerk redirect_url loops (e.g. /sign-in?redirect_url=.../sign-in?...). */
export function safeRedirectPath(raw: string | undefined, fallback = "/account"): string {
  if (!raw?.trim()) return fallback;
  const value = raw.trim();
  if (value.includes("/sign-in") || value.includes("/sign-up")) return fallback;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    if (url.pathname.startsWith("/sign-in") || url.pathname.startsWith("/sign-up")) {
      return fallback;
    }
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}

/**
 * Auth.js monta callbacks com Host/`AUTH_URL`. No Docker (HOSTNAME=0.0.0.0)
 * sem URL pública, os redirects viram https://0.0.0.0:PORT — login “não faz nada”.
 * Deriva AUTH_URL de APP_URL quando necessário e normaliza esquema https.
 */
export function ensureAuthUrlFromAppUrl(): void {
  const existing = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL)?.trim();
  if (existing) {
    process.env.AUTH_URL = normalizePublicUrl(existing);
    return;
  }

  const app = process.env.APP_URL?.trim();
  if (!app) return;
  process.env.AUTH_URL = normalizePublicUrl(app);
}

function normalizePublicUrl(raw: string): string {
  const trimmed = raw.replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Em produção atrás de proxy HTTPS; local com host sem esquema é raro.
  const isLocal =
    /^localhost\b/i.test(trimmed) ||
    /^127\./.test(trimmed) ||
    /^\[::1\]/.test(trimmed);
  return `${isLocal ? "http" : "https"}://${trimmed}`;
}

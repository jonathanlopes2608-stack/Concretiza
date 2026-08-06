import { decryptSecret, encryptSecret } from "@/src/lib/crypto-secret";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "openid",
  "email",
].join(" ");

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.APP_URL ?? "http://localhost:3047"}/api/agenda/google/callback`;
  return { clientId, clientSecret, redirectUri };
}

export function googleOAuthConfigured() {
  const { clientId, clientSecret } = googleConfig();
  return Boolean(clientId && clientSecret);
}

export function tzDefault() {
  return process.env.TZ_AGENDA || "America/Sao_Paulo";
}

export function buildGoogleAuthUrl(state: string) {
  const { clientId, redirectUri } = googleConfig();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID não configurado");
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("state", state);
  return u.toString();
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  token_type?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = googleConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha no OAuth Google: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = googleConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao renovar token Google: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function fetchGoogleEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Não foi possível obter e-mail Google");
  const data = (await res.json()) as { email?: string };
  if (!data.email) throw new Error("E-mail Google ausente");
  return data.email;
}

export type GoogleEventPayload = {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
};

export type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  updated?: string;
  status?: string;
};

export async function googleCalendarRequest<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API: ${res.status} ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function encryptTokens(access: string, refresh: string) {
  return {
    accessTokenEnc: encryptSecret(access),
    refreshTokenEnc: encryptSecret(refresh),
  };
}

export function decryptRefresh(refreshTokenEnc: string) {
  return decryptSecret(refreshTokenEnc);
}

export function decryptAccess(accessTokenEnc: string) {
  return decryptSecret(accessTokenEnc);
}

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole?: string;
};

export async function listGoogleCalendars(
  accessToken: string,
): Promise<GoogleCalendarListItem[]> {
  const data = await googleCalendarRequest<{
    items?: { id?: string; summary?: string; primary?: boolean; accessRole?: string }[];
  }>(accessToken, "/users/me/calendarList?minAccessRole=writer");
  return (data.items ?? [])
    .filter((i) => i.id)
    .map((i) => ({
      id: i.id!,
      summary: i.summary ?? i.id!,
      primary: i.primary,
      accessRole: i.accessRole,
    }));
}

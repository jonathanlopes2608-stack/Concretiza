import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "concretiza-2fa-pending";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

export function getPending2faCookieName() {
  return COOKIE_NAME;
}

export async function createPending2faToken(userId: string): Promise<string> {
  return new SignJWT({ userId, purpose: "2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecret());
}

export async function verifyPending2faToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, getSecret());
  if (payload.purpose !== "2fa" || typeof payload.userId !== "string") {
    throw new Error("Token 2FA inválido");
  }
  return payload.userId;
}

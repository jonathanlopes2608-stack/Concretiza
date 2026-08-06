import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function keyFromEnv() {
  const raw = process.env.TOKEN_ENCRYPTION_KEY ?? process.env.AUTH_SECRET ?? "";
  if (!raw) {
    throw new Error("Defina TOKEN_ENCRYPTION_KEY ou AUTH_SECRET para criptografar tokens Google");
  }
  return createHash("sha256").update(raw).digest();
}

/** Criptografa texto sensível (AES-256-GCM). Formato: iv:tag:cipher (hex). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromEnv(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Token criptografado inválido");
  const decipher = createDecipheriv("aes-256-gcm", keyFromEnv(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

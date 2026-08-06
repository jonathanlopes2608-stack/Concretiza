import { createHash } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 10 * 1024 * 1024;

const EXT_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function resolveMimeType(mimeType: string, nomeOriginal: string) {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const ext = path.extname(nomeOriginal).toLowerCase();
  return EXT_MIME[ext] || mimeType;
}

export function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || "uploads");
}

export function assertAllowedFile(mimeType: string, size: number) {
  if (!ALLOWED.has(mimeType)) {
    throw new Error("Tipo de arquivo não permitido (PDF, JPG, PNG ou WEBP)");
  }
  if (size <= 0 || size > MAX_BYTES) {
    throw new Error("Arquivo inválido ou maior que 10 MB");
  }
}

export async function salvarUpload(params: {
  propostaId: string;
  checklistRespostaId: string;
  nomeOriginal: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const mimeType = resolveMimeType(params.mimeType, params.nomeOriginal);
  assertAllowedFile(mimeType, params.buffer.length);

  const hash = createHash("sha256").update(params.buffer).digest("hex");
  const safeName = params.nomeOriginal.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 120);
  const dir = path.join(
    getUploadRoot(),
    params.propostaId,
    params.checklistRespostaId,
  );
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${hash.slice(0, 10)}-${safeName}`;
  const absolute = path.join(dir, filename);
  await writeFile(absolute, params.buffer);

  const relative = path.relative(getUploadRoot(), absolute).replace(/\\/g, "/");
  return {
    path: relative,
    hash,
    tamanhoBytes: params.buffer.length,
    absolute,
    mimeType,
  };
}

export async function removerArquivoRelativo(relativePath: string) {
  const absolute = path.join(getUploadRoot(), relativePath);
  const root = getUploadRoot();
  if (!absolute.startsWith(root)) {
    throw new Error("Caminho de arquivo inválido");
  }
  try {
    await unlink(absolute);
  } catch {
    /* já removido */
  }
}

export function absoluteFromRelative(relativePath: string) {
  const absolute = path.join(getUploadRoot(), relativePath);
  const root = getUploadRoot();
  if (!absolute.startsWith(root)) {
    throw new Error("Caminho de arquivo inválido");
  }
  return absolute;
}

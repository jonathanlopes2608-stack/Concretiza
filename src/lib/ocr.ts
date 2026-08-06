import { readFile } from "node:fs/promises";
import { absoluteFromRelative } from "@/src/lib/files";

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isImageMime(mimeType: string) {
  return IMAGE_MIMES.has(mimeType);
}

/**
 * OCR local (Tesseract.js) — português.
 * Adequado a prints de documentos digitais e scanners legíveis.
 * Primeira execução baixa os modelos de idioma (cache em ~/.tesseract.js / cwd).
 */
export async function extrairTextoImagem(relativePath: string): Promise<{
  text: string;
  confidence: number;
}> {
  const absolute = absoluteFromRelative(relativePath);
  const buffer = await readFile(absolute);

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por", 1, {
    // silencia logs verbosos no servidor
    logger: () => undefined,
  });

  try {
    const {
      data: { text, confidence },
    } = await worker.recognize(buffer);
    return {
      text: (text || "").replace(/\s+/g, " ").trim(),
      confidence: Number(confidence) || 0,
    };
  } finally {
    await worker.terminate();
  }
}

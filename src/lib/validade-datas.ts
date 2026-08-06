/**
 * Extração de data de validade a partir de texto OCR/PDF.
 * Especialmente cuidadoso com CNH (campos 4a EMISSÃO vs 4b VALIDADE).
 */

const DATE_RE = /(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/g;

function parseBrDate(d: string, m: string, y: string): Date | null {
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function normalizeTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

type DateHit = {
  date: Date;
  index: number;
};

function listarDatasComIndice(texto: string): DateHit[] {
  const hits: DateHit[] = [];
  const re = new RegExp(DATE_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(texto)) !== null) {
    const date = parseBrDate(match[1], match[2], match[3]);
    if (date) hits.push({ date, index: match.index });
  }
  return hits;
}

type LabelKind = "validade" | "emissao" | "nascimento" | "outro";

/** Último rótulo relevante imediatamente antes da data (não a janela inteira). */
function labelMaisProximo(texto: string, dateIndex: number): LabelKind {
  const before = texto.slice(Math.max(0, dateIndex - 80), dateIndex);
  const labels: { kind: LabelKind; index: number }[] = [];

  const addAll = (re: RegExp, kind: LabelKind) => {
    const r = new RegExp(re.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = r.exec(before)) !== null) {
      labels.push({ kind, index: m.index });
    }
  };

  addAll(/\b4B\b|\bVALIDADE\b|\bVENCIMENTO\b|\bVENCE\b|\bEXPIRY\b/, "validade");
  addAll(/\b4A\b|\bEMISS[AO]+\b|\bDATA\s+EMISS/, "emissao");
  addAll(/\bNASCIMENTO\b|\bNASC\b/, "nascimento");
  addAll(/\bPRIMEIRA\s+HABILIT|\b1[Aª]?\s*HABILIT/, "emissao");

  if (labels.length === 0) return "outro";
  labels.sort((a, b) => a.index - b.index);
  return labels[labels.length - 1]!.kind;
}

/**
 * CNH: OCR costuma ler "4A DATA EMISSÃO 4B VALIDADE 28/02/2026 10/02/2036"
 * (rótulos juntos, datas depois). A 1ª data após o bloco é emissão; a 2ª, validade.
 */
function extrairParEmissaoValidadeCnh(textoNorm: string): Date | null {
  const patterns = [
    /4A[\s\S]{0,100}?4B[\s\S]{0,100}?(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})[\s\S]{0,50}?(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})/i,
    /EMISS[AO]+[\s\S]{0,80}?VALIDADE[\s\S]{0,80}?(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})[\s\S]{0,50}?(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})/i,
  ];

  for (const re of patterns) {
    const par = re.exec(textoNorm);
    if (!par) continue;
    const segundo = /(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/.exec(par[2] ?? "");
    if (segundo) {
      const date = parseBrDate(segundo[1], segundo[2], segundo[3]);
      if (date) return date;
    }
  }

  const direto = /4B\s*VALIDADE[^\d]{0,24}(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/i.exec(
    textoNorm,
  );
  if (direto) return parseBrDate(direto[1], direto[2], direto[3]);

  const validadeDireta =
    /\bVALIDADE[^\d]{0,24}(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/i.exec(textoNorm);
  if (validadeDireta) {
    return parseBrDate(validadeDireta[1], validadeDireta[2], validadeDireta[3]);
  }

  return null;
}

export function extrairDatasTexto(texto: string): Date[] {
  return listarDatasComIndice(texto).map((h) => h.date);
}

/**
 * Prefere data do campo VALIDADE/4b e descarta EMISSÃO/4a/nascimento.
 * Fallback: entre datas restantes, a mais futura (típica de validade de CNH).
 */
export function escolherDataValidade(texto: string): Date | null {
  const textoNorm = normalizeTexto(texto);

  const cnh = extrairParEmissaoValidadeCnh(textoNorm);
  if (cnh) return cnh;

  const hits = listarDatasComIndice(textoNorm);
  if (hits.length === 0) return null;

  const porLabel = hits.map((h) => ({
    ...h,
    label: labelMaisProximo(textoNorm, h.index),
  }));

  const validadeHits = porLabel.filter((h) => h.label === "validade");
  if (validadeHits.length > 0) {
    return validadeHits.reduce((a, b) => (a.date > b.date ? a : b)).date;
  }

  const candidatas = porLabel.filter(
    (h) => h.label !== "emissao" && h.label !== "nascimento",
  );
  const pool = candidatas.length > 0 ? candidatas : porLabel;
  return pool.reduce((a, b) => (a.date > b.date ? a : b)).date;
}

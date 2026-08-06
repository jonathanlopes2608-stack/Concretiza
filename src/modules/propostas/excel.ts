import * as XLSX from "xlsx";
import { EXCEL_HEADERS, propostaCreateSchema } from "@/src/modules/propostas/schema";
import { criarPropostaCompleta } from "@/src/modules/propostas/service";

export type ImportResult = {
  criadas: number;
  erros: string[];
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^\uFEFF/, "");
}

function rowToObject(headers: string[], row: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  headers.forEach((h, i) => {
    obj[h] = row[i] ?? "";
  });
  return obj;
}

/** Gera buffer .xlsx modelo para download. */
export function gerarModeloExcel(): Buffer {
  const exemplo = [
    {
      numeroPropostaCaixa: "2026.0012345-01",
      numeroProcessoInterno: "AC/QA 001",
      despachanteNome: "Bruno",
      modalidade: "SBPE",
      prioridade: "NORMAL",
      compradorNome: "Maria Silva",
      compradorCpf: "12345678901",
      compradorTelefone: "11999990000",
      compradorEmail: "maria@email.com",
      vendedorNome: "João Souza",
      vendedorCpfCnpj: "98765432100",
      imovelEndereco: "Rua das Flores, 100",
      imovelCidade: "São Paulo",
      imovelUf: "SP",
      valorImovel: 450000,
      valorFinanciamento: 360000,
      imobiliaria: "Imob Exemplo",
    },
  ];
  const sheet = XLSX.utils.json_to_sheet(exemplo, { header: [...EXCEL_HEADERS] });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Propostas");
  return Buffer.from(XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
}

export async function importarLinhasExcel(
  buffer: Buffer,
  usuarioId: string,
): Promise<ImportResult> {
  const book = XLSX.read(buffer, { type: "buffer" });
  const sheetName = book.SheetNames[0];
  if (!sheetName) {
    return { criadas: 0, erros: ["Planilha vazia"] };
  }

  const sheet = book.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rows.length < 2) {
    return { criadas: 0, erros: ["Nenhuma linha de dados (só cabeçalho?)"] };
  }

  const headers = (rows[0] as unknown[]).map(normalizeHeader);
  const obrigatorios = ["compradorNome", "compradorCpf"] as const;
  const missing = obrigatorios.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      criadas: 0,
      erros: [`Cabeçalhos obrigatórios ausentes: ${missing.join(", ")}`],
    };
  }
  if (!headers.includes("numeroPropostaCaixa") && !headers.includes("numeroProcessoInterno")) {
    return {
      criadas: 0,
      erros: ["Informe numeroPropostaCaixa e/ou numeroProcessoInterno no cabeçalho"],
    };
  }

  let criadas = 0;
  const erros: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.every((cell) => String(cell ?? "").trim() === "")) continue;

    const raw = rowToObject(headers, row);
    const line = i + 1;

    const parsed = propostaCreateSchema.safeParse({
      ...raw,
      modalidade: String(raw.modalidade || "SBPE").toUpperCase(),
      prioridade: String(raw.prioridade || "NORMAL").toUpperCase(),
    });

    if (!parsed.success) {
      erros.push(`Linha ${line}: ${parsed.error.issues[0]?.message ?? "inválida"}`);
      continue;
    }

    try {
      await criarPropostaCompleta(parsed.data, "EXCEL", usuarioId);
      criadas += 1;
    } catch (error) {
      erros.push(`Linha ${line}: ${error instanceof Error ? error.message : "erro"}`);
    }
  }

  return { criadas, erros };
}

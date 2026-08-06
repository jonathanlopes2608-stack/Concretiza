import { readFile } from "node:fs/promises";
import type { ValidacaoStatus } from "@prisma/client";
import { escolherCpfDocumento, cpfIguais, formatCpf, onlyDigits } from "@/src/lib/cpf";
import { absoluteFromRelative } from "@/src/lib/files";
import { extrairTextoImagem, isImageMime } from "@/src/lib/ocr";
import { escolherDataValidade } from "@/src/lib/validade-datas";

export type ConformidadeInput = {
  documentoId: string;
  mimeType: string;
  path: string;
  tipoRegra: string;
  /** Data informada pelo analista (fallback se OCR/PDF falhar). */
  validadeInformada?: Date | null;
  /** CPF do cadastro (comprador ou vendedor) para auditar contra o documento. */
  cpfCadastro?: string | null;
};

export type ConformidadeResult = {
  status: ValidacaoStatus;
  tipoRegra: string;
  validadeDetectada?: Date | null;
  detalhes?: Record<string, unknown>;
};

export interface ConformidadeEngine {
  validar(input: ConformidadeInput): Promise<ConformidadeResult[]>;
}

type TextoExtraido = {
  texto: string;
  fonte: "pdf_texto" | "ocr_imagem" | "nenhuma";
  confiancaOcr?: number;
};

async function extrairTextoPdf(relativePath: string): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const buf = await readFile(absoluteFromRelative(relativePath));
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    await parser.destroy();
    return result.text || "";
  } catch {
    return "";
  }
}

async function extrairTextoDocumento(input: ConformidadeInput): Promise<TextoExtraido> {
  if (input.mimeType === "application/pdf") {
    const texto = await extrairTextoPdf(input.path);
    if (texto.trim()) return { texto, fonte: "pdf_texto" };
  }

  if (isImageMime(input.mimeType)) {
    const { text, confidence } = await extrairTextoImagem(input.path);
    return {
      texto: text || "",
      fonte: "ocr_imagem",
      confiancaOcr: Math.round(confidence),
    };
  }

  return { texto: "", fonte: "nenhuma" };
}

function avaliarValidade(validade: Date): ConformidadeResult["status"] {
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  const dia = new Date(validade);
  dia.setHours(0, 0, 0, 0);
  return dia.getTime() >= agora.getTime() ? "APROVADO" : "REPROVADO";
}

function validarValidade(
  texto: TextoExtraido,
  validadeInformada?: Date | null,
): ConformidadeResult {
  const tipoRegra = "VALIDADE_IDENTIDADE";
  let validadeDetectada: Date | null = null;
  let fonte: string = texto.fonte;
  const trechoOcr = texto.texto.slice(0, 320) || undefined;

  if (texto.texto.trim()) {
    const data = escolherDataValidade(texto.texto);
    if (data) {
      validadeDetectada = data;
    }
  }

  if (!validadeDetectada && validadeInformada) {
    validadeDetectada = validadeInformada;
    fonte = "informada_analista";
  }

  if (!validadeDetectada) {
    return {
      status: "PENDENTE",
      tipoRegra,
      validadeDetectada: null,
      detalhes: {
        engine: "validade-identidade",
        fonte,
        confiancaOcr: texto.confiancaOcr,
        trechoOcr,
        message:
          "Não foi possível detectar a validade no documento. Salve a data manualmente ou anexe imagem/PDF mais legível.",
      },
    };
  }

  const status = avaliarValidade(validadeDetectada);
  return {
    status,
    tipoRegra,
    validadeDetectada,
    detalhes: {
      engine: "validade-identidade",
      fonte,
      confiancaOcr: texto.confiancaOcr,
      trechoOcr: fonte === "ocr_imagem" || fonte === "pdf_texto" ? trechoOcr : undefined,
      message:
        status === "APROVADO"
          ? `Documento dentro da validade (fonte: ${fonte})`
          : `Documento vencido (fonte: ${fonte})`,
    },
  };
}

function validarCpfCadastro(
  texto: TextoExtraido,
  cpfCadastro: string | null | undefined,
): ConformidadeResult | null {
  const tipoRegra = "CPF_DOCUMENTO";
  const cadastroDigits = cpfCadastro ? onlyDigits(cpfCadastro) : "";

  // Sem CPF no cadastro (ex.: vendedor só com CNPJ) — não cria regra
  if (cadastroDigits.length !== 11) return null;

  const cpfDoc = texto.texto.trim() ? escolherCpfDocumento(texto.texto) : null;

  if (!cpfDoc) {
    return {
      status: "PENDENTE",
      tipoRegra,
      validadeDetectada: null,
      detalhes: {
        engine: "cpf-documento",
        fonte: texto.fonte,
        confiancaOcr: texto.confiancaOcr,
        cpfCadastro: formatCpf(cadastroDigits),
        message:
          "Não foi possível ler o CPF no documento (campo 4d da CNH). Confira o anexo ou o cadastro.",
      },
    };
  }

  const ok = cpfIguais(cadastroDigits, cpfDoc);
  return {
    status: ok ? "APROVADO" : "REPROVADO",
    tipoRegra,
    validadeDetectada: null,
    detalhes: {
      engine: "cpf-documento",
      fonte: texto.fonte,
      confiancaOcr: texto.confiancaOcr,
      cpfCadastro: formatCpf(cadastroDigits),
      cpfDocumento: formatCpf(cpfDoc),
      message: ok
        ? `CPF do documento confere com o cadastro (${formatCpf(cpfDoc)})`
        : `CPF do documento (${formatCpf(cpfDoc)}) diverge do cadastro (${formatCpf(cadastroDigits)})`,
    },
  };
}

/** Regra: validade + CPF (CNH/RG) contra o cadastro da proposta. */
export class IdentidadeDocumentoEngine implements ConformidadeEngine {
  async validar(input: ConformidadeInput): Promise<ConformidadeResult[]> {
    let texto: TextoExtraido;
    try {
      texto = await extrairTextoDocumento(input);
    } catch (error) {
      return [
        {
          status: "ERRO",
          tipoRegra: "VALIDADE_IDENTIDADE",
          validadeDetectada: null,
          detalhes: {
            engine: "validade-identidade",
            fonte: "ocr_imagem",
            message: `Falha no OCR: ${error instanceof Error ? error.message : "erro"}`,
          },
        },
      ];
    }

    const resultados: ConformidadeResult[] = [
      validarValidade(texto, input.validadeInformada),
    ];

    const cpfResult = validarCpfCadastro(texto, input.cpfCadastro);
    if (cpfResult) resultados.push(cpfResult);

    return resultados;
  }
}

export class PassthroughEngine implements ConformidadeEngine {
  async validar(input: ConformidadeInput): Promise<ConformidadeResult[]> {
    return [
      {
        status: "PENDENTE",
        tipoRegra: input.tipoRegra || "GERAL",
        validadeDetectada: null,
        detalhes: {
          engine: "passthrough",
          message: "Sem regra automática para este item — análise manual",
        },
      },
    ];
  }
}

export function tipoRegraParaCodigoTemplate(codigo: string): string {
  if (codigo.includes("RG_CNH") || codigo.includes("CNH")) {
    return "VALIDADE_IDENTIDADE";
  }
  return "GERAL";
}

/** CPF do cadastro a auditar conforme o item do checklist. */
export function cpfCadastroParaTemplate(
  codigo: string,
  proposta: { compradorCpf: string; vendedorCpfCnpj: string | null },
): string | null {
  if (codigo.startsWith("COMP_")) return proposta.compradorCpf;
  if (codigo.startsWith("VEND_")) {
    const digits = onlyDigits(proposta.vendedorCpfCnpj ?? "");
    return digits.length === 11 ? digits : null;
  }
  return null;
}

export function criarConformidadeEngine(tipoRegra: string): ConformidadeEngine {
  if (tipoRegra === "VALIDADE_IDENTIDADE") {
    return new IdentidadeDocumentoEngine();
  }
  return new PassthroughEngine();
}

export async function executarConformidade(
  input: ConformidadeInput,
): Promise<ConformidadeResult[]> {
  const engine = criarConformidadeEngine(input.tipoRegra);
  return engine.validar(input);
}

/** Consolida várias regras: qualquer REPROVADO → REPROVADO; todos APROVADO → APROVADO; senão PENDENTE. */
export function consolidarStatus(
  resultados: ConformidadeResult[],
): ValidacaoStatus {
  if (resultados.some((r) => r.status === "REPROVADO" || r.status === "ERRO")) {
    return "REPROVADO";
  }
  if (resultados.length > 0 && resultados.every((r) => r.status === "APROVADO")) {
    return "APROVADO";
  }
  return "PENDENTE";
}

export function mensagemConsolidada(resultados: ConformidadeResult[]): string {
  const msgs = resultados
    .map((r) => {
      const m = r.detalhes?.message;
      return typeof m === "string" ? m : `${r.tipoRegra}: ${r.status}`;
    })
    .filter(Boolean);
  return msgs.join(" · ");
}

export { escolherDataValidade, extrairDatasTexto } from "@/src/lib/validade-datas";
export { escolherCpfDocumento, extrairCpfsTexto } from "@/src/lib/cpf";

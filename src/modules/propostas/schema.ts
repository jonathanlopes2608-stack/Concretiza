import { z } from "zod";
import {
  cadastroClienteSchema,
  extrairCadastroDoForm,
} from "@/src/modules/propostas/cadastro-cliente";

const onlyDigits = (v: string) => v.replace(/\D/g, "");

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : v));

const optionalMoney = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v.replace(",", "."));
  return v;
}, z.number().nonnegative().nullable());

const basePropostaFields = {
  numeroPropostaCaixa: optionalText,
  numeroProcessoInterno: optionalText,
  despachanteNome: optionalText,
  modalidade: z.enum(["SBPE", "FGTS", "PRO_COTISTA", "OUTRO"]).default("SBPE"),
  prioridade: z.enum(["BAIXA", "NORMAL", "ALTA", "URGENTE"]).default("NORMAL"),
  compradorNome: z.string().trim().min(2, "Informe o nome do comprador"),
  compradorCpf: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((v) => v.length === 11, "CPF do comprador deve ter 11 dígitos"),
  compradorTelefone: optionalText,
  compradorEmail: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().email("E-mail inválido").optional(),
  ),
  vendedorNome: optionalText,
  vendedorCpfCnpj: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    return onlyDigits(String(v));
  }, z.string().optional()),
  imovelEndereco: optionalText,
  imovelCidade: optionalText,
  imovelUf: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    return String(v).trim().toUpperCase();
  }, z.string().length(2, "UF com 2 letras").optional()),
  valorImovel: optionalMoney,
  valorFinanciamento: optionalMoney,
  imobiliaria: optionalText,
};

export const propostaCreateSchema = z
  .object({
    ...basePropostaFields,
    cadastroCliente: cadastroClienteSchema.optional(),
  })
  .refine(
    (d) => Boolean(d.numeroPropostaCaixa?.trim() || d.numeroProcessoInterno?.trim()),
    {
      message: "Informe o nº da proposta Caixa ou o nº do processo interno",
      path: ["numeroPropostaCaixa"],
    },
  );

export const propostaUpdateSchema = z.object({
  numeroPropostaCaixa: optionalText,
  numeroProcessoInterno: optionalText,
  despachanteNome: optionalText,
  modalidade: z.enum(["SBPE", "FGTS", "PRO_COTISTA", "OUTRO"]).optional(),
  prioridade: z.enum(["BAIXA", "NORMAL", "ALTA", "URGENTE"]).optional(),
  compradorNome: z.string().trim().min(2).optional(),
  compradorCpf: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((v) => v.length === 11, "CPF inválido")
    .optional(),
  compradorTelefone: optionalText,
  compradorEmail: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().email("E-mail inválido").optional(),
  ),
  vendedorNome: optionalText,
  vendedorCpfCnpj: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    return onlyDigits(String(v));
  }, z.string().optional()),
  imovelEndereco: optionalText,
  imovelCidade: optionalText,
  imovelUf: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    return String(v).trim().toUpperCase();
  }, z.string().length(2).optional()),
  valorImovel: optionalMoney,
  valorFinanciamento: optionalMoney,
  imobiliaria: optionalText,
  cadastroCliente: cadastroClienteSchema.optional(),
});

export type PropostaCreateInput = z.infer<typeof propostaCreateSchema>;
export type PropostaUpdateInput = z.infer<typeof propostaUpdateSchema>;

/** Parse completo a partir do FormData (inclui campos cc_* do cadastro). */
export function parsePropostaForm(raw: Record<string, string>) {
  const cadastroCliente = extrairCadastroDoForm(raw);
  return {
    ...raw,
    cadastroCliente,
  };
}

export const EXCEL_HEADERS = [
  "numeroPropostaCaixa",
  "numeroProcessoInterno",
  "despachanteNome",
  "modalidade",
  "prioridade",
  "compradorNome",
  "compradorCpf",
  "compradorTelefone",
  "compradorEmail",
  "vendedorNome",
  "vendedorCpfCnpj",
  "imovelEndereco",
  "imovelCidade",
  "imovelUf",
  "valorImovel",
  "valorFinanciamento",
  "imobiliaria",
] as const;

import { z } from "zod";

const opt = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : v));

const boolFromForm = z.preprocess((v) => {
  if (v === true || v === "true" || v === "on" || v === "1") return true;
  if (v === false || v === "false" || v === "0" || v === "" || v == null) return false;
  return Boolean(v);
}, z.boolean());

/** Estrutura do formulário de cadastro de clientes (layout Caixa). */
export const cadastroClienteSchema = z.object({
  protocolo: opt,
  codigoCorrespondente: opt,

  propMovimentacaoConta: boolFromForm.optional().default(false),
  propEmprestimos: boolFromForm.optional().default(false),
  propFinanciamentoHabitacional: z
    .enum(["SIM", "NAO", ""])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  propInvestimentos: boolFromForm.optional().default(false),
  propCartaoCredito: boolFromForm.optional().default(false),
  propSeguros: boolFromForm.optional().default(false),
  propOperacoesInternacionais: boolFromForm.optional().default(false),

  nomeReduzido: opt,
  dataNascimento: opt,
  sexo: opt,
  naturalidade: opt,
  nacionalidade: opt,
  nomePai: opt,
  nomeMae: opt,
  grauInstrucao: opt,
  docTipo: opt,
  docNumero: opt,
  docOrgaoEmissor: opt,
  docDataEmissao: opt,
  docDataValidade: opt,
  docUf: opt,
  estadoCivil: opt,
  pisNis: opt,
  tipoOcupacao: opt,
  dataPrimeiraHabilitacao: opt,

  enderecoCep: opt,
  enderecoLogradouro: opt,
  enderecoNumero: opt,
  enderecoComplemento: opt,
  enderecoBairro: opt,
  enderecoMunicipio: opt,
  enderecoUf: opt,
  enderecoTipoImovel: opt,
  comprovanteResidencia: opt,
  ocupacaoImovel: opt,

  fontePagadoraTipo: opt,
  fontePagadoraCnpj: opt,
  fontePagadoraNome: opt,
  ocupacaoProfissional: opt,
  dataAdmissao: opt,
  caracteristicaRenda: opt,
  rendaBruta: opt,
  rendaLiquida: opt,
  documentoComprovanteRenda: opt,
  impostoRendaRetido: opt,
  dataRefComprovante: opt,
  tempoEmpregoAnterior: opt,
  anoDesligamentoAnterior: opt,
  rendasInformais: opt,

  agenciaUf: opt,
  agenciaMunicipio: opt,
  agenciaCodigoNome: opt,

  codigoConvenio: opt,
  identificacaoOperador: opt,
});

export type CadastroCliente = z.infer<typeof cadastroClienteSchema>;

export const CADASTRO_FIELD_KEYS = [
  "protocolo",
  "codigoCorrespondente",
  "propMovimentacaoConta",
  "propEmprestimos",
  "propFinanciamentoHabitacional",
  "propInvestimentos",
  "propCartaoCredito",
  "propSeguros",
  "propOperacoesInternacionais",
  "nomeReduzido",
  "dataNascimento",
  "sexo",
  "naturalidade",
  "nacionalidade",
  "nomePai",
  "nomeMae",
  "grauInstrucao",
  "docTipo",
  "docNumero",
  "docOrgaoEmissor",
  "docDataEmissao",
  "docDataValidade",
  "docUf",
  "estadoCivil",
  "pisNis",
  "tipoOcupacao",
  "dataPrimeiraHabilitacao",
  "enderecoCep",
  "enderecoLogradouro",
  "enderecoNumero",
  "enderecoComplemento",
  "enderecoBairro",
  "enderecoMunicipio",
  "enderecoUf",
  "enderecoTipoImovel",
  "comprovanteResidencia",
  "ocupacaoImovel",
  "fontePagadoraTipo",
  "fontePagadoraCnpj",
  "fontePagadoraNome",
  "ocupacaoProfissional",
  "dataAdmissao",
  "caracteristicaRenda",
  "rendaBruta",
  "rendaLiquida",
  "documentoComprovanteRenda",
  "impostoRendaRetido",
  "dataRefComprovante",
  "tempoEmpregoAnterior",
  "anoDesligamentoAnterior",
  "rendasInformais",
  "agenciaUf",
  "agenciaMunicipio",
  "agenciaCodigoNome",
  "codigoConvenio",
  "identificacaoOperador",
] as const;

const CHECKBOX_KEYS = new Set([
  "propMovimentacaoConta",
  "propEmprestimos",
  "propInvestimentos",
  "propCartaoCredito",
  "propSeguros",
  "propOperacoesInternacionais",
]);

/** Extrai campos `cc_*` do FormData / objeto plano. */
export function extrairCadastroDoForm(
  raw: Record<string, string>,
): CadastroCliente {
  const slice: Record<string, string> = {};
  for (const key of CADASTRO_FIELD_KEYS) {
    const formKey = `cc_${key}`;
    if (CHECKBOX_KEYS.has(key)) {
      slice[key] = raw[formKey] === "on" || raw[formKey] === "true" ? "true" : "false";
    } else if (raw[formKey] !== undefined) {
      slice[key] = raw[formKey];
    }
  }
  return cadastroClienteSchema.parse(slice);
}

export function parseCadastroCliente(value: unknown): CadastroCliente {
  if (!value || typeof value !== "object") {
    return cadastroClienteSchema.parse({});
  }
  return cadastroClienteSchema.parse(value);
}

export function ccVal(
  cadastro: CadastroCliente | null | undefined,
  key: keyof CadastroCliente,
): string {
  if (!cadastro) return "";
  const v = cadastro[key];
  if (v === true) return "true";
  if (v === false || v == null) return "";
  return String(v);
}

export function ccChecked(
  cadastro: CadastroCliente | null | undefined,
  key: keyof CadastroCliente,
): boolean {
  return Boolean(cadastro?.[key]);
}

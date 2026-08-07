"use client";

import type { CadastroCliente } from "@/src/modules/propostas/cadastro-cliente";
import { ccChecked, ccVal } from "@/src/modules/propostas/cadastro-cliente";

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

type Props = { cadastro?: CadastroCliente | null };

export function CadastroClienteSections({ cadastro }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        Campos do formulário de cadastro de clientes (Caixa). Usados na impressão/exportação PDF.
      </p>

      <Accordion title="Identificação do formulário" defaultOpen>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Protocolo" name="cc_protocolo" defaultValue={ccVal(cadastro, "protocolo")} />
          <Field
            label="Código do Correspondente"
            name="cc_codigoCorrespondente"
            defaultValue={ccVal(cadastro, "codigoCorrespondente")}
          />
        </div>
      </Accordion>

      <Accordion title="Declaração de propósitos">
        <div className="space-y-2 text-sm">
          <Check
            name="cc_propMovimentacaoConta"
            label="Movimentação de Conta de Depósito / Poupança"
            defaultChecked={ccChecked(cadastro, "propMovimentacaoConta")}
          />
          <Check
            name="cc_propEmprestimos"
            label="Empréstimos / Financiamentos"
            defaultChecked={ccChecked(cadastro, "propEmprestimos")}
          />
          <div className="flex flex-wrap items-center gap-3 py-1">
            <span className="text-xs font-medium text-neutral-600">Financiamento Habitacional</span>
            <select
              name="cc_propFinanciamentoHabitacional"
              defaultValue={ccVal(cadastro, "propFinanciamentoHabitacional") || ""}
              className={`${fieldClass} max-w-[10rem]`}
            >
              <option value="">—</option>
              <option value="SIM">SIM</option>
              <option value="NAO">NÃO</option>
            </select>
          </div>
          <Check
            name="cc_propInvestimentos"
            label="Investimentos"
            defaultChecked={ccChecked(cadastro, "propInvestimentos")}
          />
          <Check
            name="cc_propCartaoCredito"
            label="Cartão de Crédito"
            defaultChecked={ccChecked(cadastro, "propCartaoCredito")}
          />
          <Check
            name="cc_propSeguros"
            label="Seguros / Previdência / Capitalização / Consórcios"
            defaultChecked={ccChecked(cadastro, "propSeguros")}
          />
          <Check
            name="cc_propOperacoesInternacionais"
            label="Operações Internacionais / Câmbio"
            defaultChecked={ccChecked(cadastro, "propOperacoesInternacionais")}
          />
        </div>
      </Accordion>

      <Accordion title="Dados cadastrais do cliente" defaultOpen>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome reduzido" name="cc_nomeReduzido" defaultValue={ccVal(cadastro, "nomeReduzido")} />
          <Field
            label="Data de nascimento"
            name="cc_dataNascimento"
            placeholder="DD/MM/AAAA"
            defaultValue={ccVal(cadastro, "dataNascimento")}
          />
          <Field label="Sexo" name="cc_sexo" defaultValue={ccVal(cadastro, "sexo")} />
          <Field label="Naturalidade" name="cc_naturalidade" defaultValue={ccVal(cadastro, "naturalidade")} />
          <Field label="Nacionalidade" name="cc_nacionalidade" defaultValue={ccVal(cadastro, "nacionalidade")} />
          <Field label="Estado civil" name="cc_estadoCivil" defaultValue={ccVal(cadastro, "estadoCivil")} />
          <Field label="Nome do pai" name="cc_nomePai" defaultValue={ccVal(cadastro, "nomePai")} className="md:col-span-2" />
          <Field label="Nome da mãe" name="cc_nomeMae" defaultValue={ccVal(cadastro, "nomeMae")} className="md:col-span-2" />
          <Field label="Grau de instrução" name="cc_grauInstrucao" defaultValue={ccVal(cadastro, "grauInstrucao")} />
          <Field label="PIS/NIS" name="cc_pisNis" defaultValue={ccVal(cadastro, "pisNis")} />
          <Field label="Tipo de ocupação" name="cc_tipoOcupacao" defaultValue={ccVal(cadastro, "tipoOcupacao")} />
          <Field
            label="Data 1º habilitação"
            name="cc_dataPrimeiraHabilitacao"
            placeholder="DD/MM/AAAA"
            defaultValue={ccVal(cadastro, "dataPrimeiraHabilitacao")}
          />
        </div>
        <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Documento de identificação
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tipo de documento" name="cc_docTipo" defaultValue={ccVal(cadastro, "docTipo")} className="md:col-span-2" />
          <Field label="Número do documento" name="cc_docNumero" defaultValue={ccVal(cadastro, "docNumero")} />
          <Field label="Órgão emissor" name="cc_docOrgaoEmissor" defaultValue={ccVal(cadastro, "docOrgaoEmissor")} />
          <Field label="Data de emissão" name="cc_docDataEmissao" defaultValue={ccVal(cadastro, "docDataEmissao")} />
          <Field label="Data de validade" name="cc_docDataValidade" defaultValue={ccVal(cadastro, "docDataValidade")} />
          <Field label="UF do documento" name="cc_docUf" maxLength={2} defaultValue={ccVal(cadastro, "docUf")} />
        </div>
      </Accordion>

      <Accordion title="Endereço residencial">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="CEP" name="cc_enderecoCep" defaultValue={ccVal(cadastro, "enderecoCep")} />
          <Field
            label="Logradouro"
            name="cc_enderecoLogradouro"
            defaultValue={ccVal(cadastro, "enderecoLogradouro")}
            className="md:col-span-2"
          />
          <Field label="Número" name="cc_enderecoNumero" defaultValue={ccVal(cadastro, "enderecoNumero")} />
          <Field
            label="Complemento"
            name="cc_enderecoComplemento"
            defaultValue={ccVal(cadastro, "enderecoComplemento")}
          />
          <Field label="Bairro" name="cc_enderecoBairro" defaultValue={ccVal(cadastro, "enderecoBairro")} />
          <Field label="Município" name="cc_enderecoMunicipio" defaultValue={ccVal(cadastro, "enderecoMunicipio")} />
          <Field label="UF" name="cc_enderecoUf" maxLength={2} defaultValue={ccVal(cadastro, "enderecoUf")} />
          <Field
            label="Tipo de imóvel"
            name="cc_enderecoTipoImovel"
            defaultValue={ccVal(cadastro, "enderecoTipoImovel")}
          />
          <Field
            label="Ocupação do imóvel"
            name="cc_ocupacaoImovel"
            defaultValue={ccVal(cadastro, "ocupacaoImovel")}
          />
          <Field
            label="Comprovante de residência"
            name="cc_comprovanteResidencia"
            defaultValue={ccVal(cadastro, "comprovanteResidencia")}
            className="md:col-span-3"
          />
        </div>
      </Accordion>

      <Accordion title="Rendas comprovadas">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Tipo (ex.: Jurídica)"
            name="cc_fontePagadoraTipo"
            defaultValue={ccVal(cadastro, "fontePagadoraTipo")}
          />
          <Field label="CNPJ da fonte pagadora" name="cc_fontePagadoraCnpj" defaultValue={ccVal(cadastro, "fontePagadoraCnpj")} />
          <Field
            label="Nome da fonte pagadora"
            name="cc_fontePagadoraNome"
            defaultValue={ccVal(cadastro, "fontePagadoraNome")}
            className="md:col-span-2"
          />
          <Field
            label="Ocupação profissional"
            name="cc_ocupacaoProfissional"
            defaultValue={ccVal(cadastro, "ocupacaoProfissional")}
            className="md:col-span-2"
          />
          <Field label="Admissão" name="cc_dataAdmissao" defaultValue={ccVal(cadastro, "dataAdmissao")} />
          <Field
            label="Característica da renda"
            name="cc_caracteristicaRenda"
            defaultValue={ccVal(cadastro, "caracteristicaRenda")}
          />
          <Field label="Renda bruta" name="cc_rendaBruta" defaultValue={ccVal(cadastro, "rendaBruta")} />
          <Field label="Renda líquida" name="cc_rendaLiquida" defaultValue={ccVal(cadastro, "rendaLiquida")} />
          <Field
            label="Documento do comprovante de renda"
            name="cc_documentoComprovanteRenda"
            defaultValue={ccVal(cadastro, "documentoComprovanteRenda")}
            className="md:col-span-2"
          />
          <Field
            label="Imposto de renda retido"
            name="cc_impostoRendaRetido"
            defaultValue={ccVal(cadastro, "impostoRendaRetido")}
          />
          <Field
            label="Data ref. do comprovante"
            name="cc_dataRefComprovante"
            defaultValue={ccVal(cadastro, "dataRefComprovante")}
          />
          <Field
            label="Tempo no emprego anterior"
            name="cc_tempoEmpregoAnterior"
            defaultValue={ccVal(cadastro, "tempoEmpregoAnterior")}
          />
          <Field
            label="Ano de desligamento do emprego anterior"
            name="cc_anoDesligamentoAnterior"
            defaultValue={ccVal(cadastro, "anoDesligamentoAnterior")}
          />
          <Field
            label="Rendas informais (observações)"
            name="cc_rendasInformais"
            defaultValue={ccVal(cadastro, "rendasInformais")}
            className="md:col-span-2"
          />
        </div>
      </Accordion>

      <Accordion title="Agência de relacionamento e operador">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="UF da agência" name="cc_agenciaUf" maxLength={2} defaultValue={ccVal(cadastro, "agenciaUf")} />
          <Field label="Município da agência" name="cc_agenciaMunicipio" defaultValue={ccVal(cadastro, "agenciaMunicipio")} />
          <Field
            label="Código e nome das agências"
            name="cc_agenciaCodigoNome"
            defaultValue={ccVal(cadastro, "agenciaCodigoNome")}
            className="md:col-span-2"
          />
          <Field label="Código do convênio" name="cc_codigoConvenio" defaultValue={ccVal(cadastro, "codigoConvenio")} />
          <Field
            label="Identificação do operador"
            name="cc_identificacaoOperador"
            defaultValue={ccVal(cadastro, "identificacaoOperador")}
          />
        </div>
      </Accordion>
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-lg border border-slate-200 bg-surface open:pb-4"
    >
      <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-brand-900 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span className="text-neutral-400">▸</span>
          {title}
        </span>
      </summary>
      <div className="px-5 pt-1">{children}</div>
    </details>
  );
}

function Field({
  label,
  name,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-xs font-medium text-neutral-600">
        {label}
      </label>
      <input id={name} name={name} className={fieldClass} {...props} />
    </div>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        name={name}
        value="on"
        defaultChecked={defaultChecked}
        className="mt-0.5 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
      />
      <span>{label}</span>
    </label>
  );
}

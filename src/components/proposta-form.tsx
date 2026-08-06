"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  atualizarPropostaAction,
  criarPropostaAction,
} from "@/src/modules/propostas/actions";

type Initial = {
  numeroPropostaCaixa?: string | null;
  numeroProcessoInterno?: string | null;
  despachanteNome?: string | null;
  modalidade?: string;
  prioridade?: string;
  compradorNome?: string;
  compradorCpf?: string;
  compradorTelefone?: string | null;
  compradorEmail?: string | null;
  vendedorNome?: string | null;
  vendedorCpfCnpj?: string | null;
  imovelEndereco?: string | null;
  imovelCidade?: string | null;
  imovelUf?: string | null;
  valorImovel?: string | number | null;
  valorFinanciamento?: string | number | null;
  imobiliaria?: string | null;
};

type Props = {
  mode: "create" | "edit";
  propostaId?: string;
  initial?: Initial;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

export function PropostaForm({ mode, propostaId, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    const result =
      mode === "create"
        ? await criarPropostaAction(formData)
        : await atualizarPropostaAction(propostaId!, formData);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (mode === "create" && result.data?.id) {
      router.push(`/propostas/${result.data.id}`);
    } else if (propostaId) {
      router.push(`/propostas/${propostaId}`);
    } else {
      router.push("/fila");
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold text-brand-900">Identificação</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Nº processo interno"
            name="numeroProcessoInterno"
            defaultValue={initial?.numeroProcessoInterno ?? ""}
            placeholder="Ex.: AC/QA 076"
          />
          <Field
            label="Nº proposta Caixa"
            name="numeroPropostaCaixa"
            defaultValue={initial?.numeroPropostaCaixa ?? ""}
            placeholder="Opcional se ainda não houver"
          />
          <Field
            label="Despachante"
            name="despachanteNome"
            defaultValue={initial?.despachanteNome ?? ""}
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Modalidade</label>
            <select name="modalidade" defaultValue={initial?.modalidade ?? "SBPE"} className={fieldClass}>
              <option value="SBPE">SBPE</option>
              <option value="FGTS">FGTS</option>
              <option value="PRO_COTISTA">Pró-Cotista</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Prioridade</label>
            <select name="prioridade" defaultValue={initial?.prioridade ?? "NORMAL"} className={fieldClass}>
              <option value="BAIXA">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <Field label="Imobiliária" name="imobiliaria" defaultValue={initial?.imobiliaria ?? ""} />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Informe pelo menos o nº do processo interno ou o nº da proposta Caixa.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold text-brand-900">Comprador</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome *" name="compradorNome" required defaultValue={initial?.compradorNome} />
          <Field label="CPF *" name="compradorCpf" required defaultValue={initial?.compradorCpf} />
          <Field label="Telefone" name="compradorTelefone" defaultValue={initial?.compradorTelefone ?? ""} />
          <Field label="E-mail" name="compradorEmail" type="email" defaultValue={initial?.compradorEmail ?? ""} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold text-brand-900">Vendedor</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" name="vendedorNome" defaultValue={initial?.vendedorNome ?? ""} />
          <Field label="CPF/CNPJ" name="vendedorCpfCnpj" defaultValue={initial?.vendedorCpfCnpj ?? ""} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold text-brand-900">Imóvel</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Endereço" name="imovelEndereco" defaultValue={initial?.imovelEndereco ?? ""} className="md:col-span-3" />
          <Field label="Cidade" name="imovelCidade" defaultValue={initial?.imovelCidade ?? ""} />
          <Field label="UF" name="imovelUf" defaultValue={initial?.imovelUf ?? ""} maxLength={2} />
          <Field label="Valor do imóvel" name="valorImovel" type="number" step="0.01" defaultValue={initial?.valorImovel ?? ""} />
          <Field label="Valor financiamento" name="valorFinanciamento" type="number" step="0.01" defaultValue={initial?.valorFinanciamento ?? ""} />
        </div>
      </section>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
        >
          {loading ? "Salvando..." : mode === "create" ? "Cadastrar proposta" : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-slate-300 px-4 py-2.5 text-sm text-brand-900 hover:bg-neutral-100"
        >
          Cancelar
        </button>
      </div>
    </form>
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

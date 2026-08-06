"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  atualizarCompromissoAction,
  criarCompromissoAction,
  excluirCompromissoAction,
} from "@/src/modules/agenda/actions";

const TIPOS = [
  { value: "ASSINATURA", label: "Assinatura" },
  { value: "RETORNO_PENDENCIA", label: "Retorno de pendência" },
  { value: "PRAZO", label: "Prazo" },
  { value: "OUTRO", label: "Outro" },
];

type PropostaOpt = {
  id: string;
  numeroProcessoInterno: string | null;
  numeroPropostaCaixa: string | null;
  compradorNome: string;
};

type Props = {
  mode: "create" | "edit";
  propostas: PropostaOpt[];
  initial?: {
    id: string;
    titulo: string;
    tipo: string;
    inicio: string;
    fim: string;
    observacao: string;
    propostaId: string;
  };
  readOnly?: boolean;
};

function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CompromissoForm({ mode, propostas, initial, readOnly }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const result =
        mode === "create"
          ? await criarCompromissoAction(formData)
          : await atualizarCompromissoAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/agenda");
      router.refresh();
    });
  }

  function onDelete() {
    if (!initial || !confirm("Excluir este compromisso?")) return;
    const fd = new FormData();
    fd.set("id", initial.id);
    start(async () => {
      const result = await excluirCompromissoAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/agenda");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-surface p-5">
      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {mode === "edit" && initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="titulo" className="mb-1 block text-xs font-medium text-neutral-600">
            Título *
          </label>
          <input
            id="titulo"
            name="titulo"
            required
            disabled={readOnly}
            defaultValue={initial?.titulo ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="tipo" className="mb-1 block text-xs font-medium text-neutral-600">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            disabled={readOnly}
            defaultValue={initial?.tipo ?? "OUTRO"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="propostaId" className="mb-1 block text-xs font-medium text-neutral-600">
            Proposta (opcional)
          </label>
          <select
            id="propostaId"
            name="propostaId"
            disabled={readOnly}
            defaultValue={initial?.propostaId ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {propostas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.numeroProcessoInterno || p.numeroPropostaCaixa || p.id.slice(0, 8)} —{" "}
                {p.compradorNome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inicio" className="mb-1 block text-xs font-medium text-neutral-600">
            Início *
          </label>
          <input
            id="inicio"
            name="inicio"
            type="datetime-local"
            required
            disabled={readOnly}
            defaultValue={initial ? toLocalInput(initial.inicio) : ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="fim" className="mb-1 block text-xs font-medium text-neutral-600">
            Fim
          </label>
          <input
            id="fim"
            name="fim"
            type="datetime-local"
            disabled={readOnly}
            defaultValue={initial?.fim ? toLocalInput(initial.fim) : ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="observacao" className="mb-1 block text-xs font-medium text-neutral-600">
            Observação
          </label>
          <textarea
            id="observacao"
            name="observacao"
            rows={3}
            disabled={readOnly}
            defaultValue={initial?.observacao ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {pending ? "Salvando…" : mode === "create" ? "Criar" : "Salvar"}
          </button>
          {mode === "edit" ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Excluir
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => router.push("/agenda")}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-neutral-100"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => router.push("/agenda")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          Voltar
        </button>
      )}
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import {
  abrirBloqueioAction,
  resolverBloqueioAction,
} from "@/src/modules/bloqueios/actions";

type Tipo = { id: string; label: string; codigo: string };

type Bloqueio = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: "ABERTO" | "RESOLVIDO";
  origem: string;
  abertoEm: Date | string;
  resolvidoEm: Date | string | null;
  tipoDependencia: Tipo;
  abertoPor: { nome: string } | null;
  resolvidoPor: { nome: string } | null;
};

type Props = {
  propostaId: string;
  bloqueios: Bloqueio[];
  tipos: Tipo[];
  podeEditar: boolean;
};

function dt(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function BloqueiosPanel({ propostaId, bloqueios, tipos, podeEditar }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onAbrir(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await abrirBloqueioAction(formData);
      if (!result.ok) setError(result.error);
    });
  }

  function onResolver(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await resolverBloqueioAction(formData);
      if (!result.ok) setError(result.error);
    });
  }

  const abertos = bloqueios.filter((b) => b.status === "ABERTO");
  const resolvidos = bloqueios.filter((b) => b.status === "RESOLVIDO");

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-surface p-5">
      <h3 className="text-sm font-semibold text-brand-900">
        Bloqueios / de quem depende
      </h3>

      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {abertos.length === 0 ? (
        <p className="text-sm text-neutral-600">Nenhum bloqueio aberto.</p>
      ) : (
        <ul className="space-y-2">
          {abertos.map((b) => (
            <li key={b.id} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              <div className="font-medium text-amber-950">
                {b.tipoDependencia.label}: {b.titulo}
              </div>
              {b.descricao ? <p className="text-xs text-amber-900">{b.descricao}</p> : null}
              <p className="mt-1 text-xs text-neutral-600">
                Aberto {dt(b.abertoEm)} · {b.abertoPor?.nome ?? "sistema"} · {b.origem}
              </p>
              {podeEditar ? (
                <form action={onResolver} className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="bloqueioId" value={b.id} />
                  <input type="hidden" name="propostaId" value={propostaId} />
                  <input
                    name="observacao"
                    placeholder="Obs. ao resolver"
                    className="min-w-[12rem] flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded bg-brand-700 px-3 py-1 text-xs font-medium text-white hover:bg-brand-900"
                  >
                    Resolver
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {podeEditar ? (
        <form action={onAbrir} className="space-y-2 border-t border-slate-100 pt-4">
          <input type="hidden" name="propostaId" value={propostaId} />
          <p className="text-xs font-medium text-neutral-600">Abrir bloqueio</p>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              name="tipoDependenciaId"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                De quem depende…
              </option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              name="titulo"
              required
              minLength={3}
              placeholder="O que precisa para seguir"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <input
            name="descricao"
            placeholder="Detalhe (opcional)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Registrar bloqueio
          </button>
        </form>
      ) : null}

      {resolvidos.length > 0 ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-neutral-600">
            Resolvidos ({resolvidos.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {resolvidos.map((b) => (
              <li key={b.id} className="rounded bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
                {b.tipoDependencia.label}: {b.titulo} · resolvido {dt(b.resolvidoEm)} por{" "}
                {b.resolvidoPor?.nome ?? "—"}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

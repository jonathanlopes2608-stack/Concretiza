"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  compartilharAgendaAction,
  removerCompartilhamentoAction,
} from "@/src/modules/agenda/actions";

type ShareRow = {
  id: string;
  viewerLabel: string;
  viewerUsuarioId: string | null;
  viewerGrupoId: string | null;
};

type Opt = { id: string; label: string };

export function AgendaCompartilharClient({
  shares,
  usuarios,
  grupos,
}: {
  shares: ShareRow[];
  usuarios: Opt[];
  grupos: Opt[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [modo, setModo] = useState<"usuario" | "grupo">("usuario");

  function onAdd(formData: FormData) {
    setError(null);
    start(async () => {
      const r = await compartilharAgendaAction(formData);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  function onRemove(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    start(async () => {
      const r = await removerCompartilhamentoAction(fd);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-surface">
        {shares.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-neutral-600">
            Ninguém com acesso à sua agenda ainda.
          </li>
        ) : (
          shares.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-brand-900">{s.viewerLabel}</p>
                <p className="text-xs text-neutral-500">
                  {s.viewerGrupoId ? "Grupo" : "Usuário"} · leitura
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => onRemove(s.id)}
                className="text-xs text-red-700 hover:underline"
              >
                Remover
              </button>
            </li>
          ))
        )}
      </ul>

      <form action={onAdd} className="space-y-3 rounded-lg border border-slate-200 bg-surface p-4">
        <p className="text-sm font-medium text-brand-900">Liberar visualização</p>
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={modo === "usuario"}
              onChange={() => setModo("usuario")}
            />
            Usuário
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={modo === "grupo"}
              onChange={() => setModo("grupo")}
            />
            Grupo
          </label>
        </div>
        {modo === "usuario" ? (
          <select
            name="viewerUsuarioId"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        ) : (
          <select
            name="viewerGrupoId"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-900"
        >
          Compartilhar
        </button>
      </form>
    </div>
  );
}

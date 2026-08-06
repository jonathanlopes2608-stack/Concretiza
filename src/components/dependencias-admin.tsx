"use client";

import { useState, useTransition } from "react";
import {
  criarTipoDependenciaAction,
  toggleTipoDependenciaAction,
} from "@/src/modules/bloqueios/actions";

type Tipo = {
  id: string;
  codigo: string;
  label: string;
  ativo: boolean;
  sistema: boolean;
};

export function DependenciasAdmin({ tipos }: { tipos: Tipo[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onCreate(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await criarTipoDependenciaAction(formData);
      if (!result.ok) setError(result.error);
    });
  }

  function onToggle(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await toggleTipoDependenciaAction(formData);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-surface">
        {tipos.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-brand-900">{t.label}</p>
              <p className="text-xs text-neutral-600">
                {t.codigo}
                {t.sistema ? " · sistema" : ""}
                {!t.ativo ? " · inativo" : ""}
              </p>
            </div>
            <form action={onToggle}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="ativo" value={t.ativo ? "false" : "true"} />
              <button
                type="submit"
                disabled={pending}
                className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-neutral-100"
              >
                {t.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form action={onCreate} className="space-y-3 rounded-lg border border-slate-200 bg-surface p-4">
        <p className="text-sm font-medium text-brand-900">Criar novo tipo</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="codigo"
            required
            placeholder="Código (ex.: CORRETOR)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="label"
            required
            placeholder="Nome exibido"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
        >
          Adicionar
        </button>
      </form>
    </div>
  );
}

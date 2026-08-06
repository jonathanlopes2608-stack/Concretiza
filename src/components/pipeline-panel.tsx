"use client";

import { useState, useTransition } from "react";
import type { FaseProcesso, Role } from "@prisma/client";
import { FaseBadge } from "@/src/components/status-badge";
import { FASE_LABELS, fasesPermitidas, podeForcarComBloqueio } from "@/src/lib/fases";
import {
  atribuirAnalistaAction,
  transicionarFaseAction,
} from "@/src/modules/pipeline/actions";

type Analista = { id: string; nome: string };

type Props = {
  propostaId: string;
  faseAtual: FaseProcesso;
  analistaId: string | null;
  temBloqueioAberto: boolean;
  userRole: Role;
  userId: string;
  analistas: Analista[];
};

export function PipelinePanel({
  propostaId,
  faseAtual,
  analistaId,
  temBloqueioAberto,
  userRole,
  userId,
  analistas,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const permitidas = fasesPermitidas(faseAtual, userRole);
  const podeForcar = podeForcarComBloqueio(userRole);

  function onTransicao(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await transicionarFaseAction(formData);
      if (!result.ok) setError(result.error);
    });
  }

  function onAtribuir(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await atribuirAnalistaAction(formData);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-brand-900">Pipeline</h3>
        <FaseBadge fase={faseAtual} />
      </div>

      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {temBloqueioAberto ? (
        <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Há bloqueios abertos. Analistas precisam resolvê-los; coordenador pode forçar avanço.
        </p>
      ) : null}

      {permitidas.length > 0 ? (
        <form action={onTransicao} className="space-y-3">
          <input type="hidden" name="propostaId" value={propostaId} />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Nova fase</label>
              <select
                name="novaFase"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {permitidas.map((f) => (
                  <option key={f} value={f}>
                    {FASE_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Motivo (cancelamento/reprovação)
              </label>
              <input
                name="motivo"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Obrigatório se cancelar/reprovar"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Observação</label>
            <input
              name="observacao"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Opcional (obrigatória se forçar com bloqueio)"
            />
          </div>
          {podeForcar && temBloqueioAberto ? (
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" name="forcarComBloqueio" />
              Forçar avanço com bloqueio aberto
            </label>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Alterar fase"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-neutral-600">Sem transições disponíveis para o seu perfil.</p>
      )}

      <form action={onAtribuir} className="border-t border-slate-100 pt-4">
        <input type="hidden" name="propostaId" value={propostaId} />
        <label className="mb-1 block text-xs font-medium text-neutral-600">Analista</label>
        <div className="flex flex-wrap gap-2">
          {userRole === "ANALISTA" ? (
            <>
              <input type="hidden" name="analistaId" value={userId} />
              <button
                type="submit"
                disabled={pending || analistaId === userId}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50"
              >
                {analistaId === userId ? "Atribuída a você" : "Assumir proposta"}
              </button>
            </>
          ) : (
            <>
              <select
                name="analistaId"
                defaultValue={analistaId ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Sem analista</option>
                {analistas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100"
              >
                Atribuir
              </button>
            </>
          )}
        </div>
      </form>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CATALOGO_PERMISSOES } from "@/src/lib/permissoes";
import {
  atualizarUsuarioAction,
  criarUsuarioAction,
} from "@/src/modules/usuarios/actions";

type GrupoOpt = {
  id: string;
  nome: string;
  descricao: string;
  role: "ADMIN" | "COORDENADOR" | "ANALISTA" | "VISUALIZACAO";
  permissoes: string[];
};

type Props = {
  mode: "create" | "edit";
  grupos: GrupoOpt[];
  initial?: {
    id: string;
    email: string;
    nome: string;
    sobrenome: string;
    grupoId: string;
    ativo: boolean;
  };
};

export function UsuarioForm({ mode, grupos, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const defaultGrupo =
    initial?.grupoId ||
    grupos.find((g) => g.role === "ANALISTA")?.id ||
    grupos[0]?.id ||
    "";
  const [grupoId, setGrupoId] = useState(defaultGrupo);
  const grupoSel = useMemo(
    () => grupos.find((g) => g.id === grupoId),
    [grupos, grupoId],
  );
  const labelsPerm = useMemo(() => {
    if (!grupoSel?.permissoes?.length) return [];
    const map = new Map<string, string>(
      CATALOGO_PERMISSOES.map((p) => [p.codigo, p.label]),
    );
    return grupoSel.permissoes.map((c) => map.get(c) ?? c);
  }, [grupoSel]);

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const result =
        mode === "create"
          ? await criarUsuarioAction(formData)
          : await atualizarUsuarioAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/usuarios");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-surface p-5">
      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-neutral-600">
            E-mail *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={initial?.email ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="nome" className="mb-1 block text-xs font-medium text-neutral-600">
            Nome *
          </label>
          <input
            id="nome"
            name="nome"
            required
            defaultValue={initial?.nome ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="sobrenome" className="mb-1 block text-xs font-medium text-neutral-600">
            Sobrenome *
          </label>
          <input
            id="sobrenome"
            name="sobrenome"
            required
            defaultValue={initial?.sobrenome ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="grupoId" className="mb-1 block text-xs font-medium text-neutral-600">
            Grupo de usuário *
          </label>
          <select
            id="grupoId"
            name="grupoId"
            required
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
          {grupoSel ? (
            <div className="mt-2 rounded-md border border-slate-100 bg-neutral-100/80 px-3 py-2 text-xs text-neutral-700">
              {grupoSel.descricao ? (
                <p className="font-medium text-brand-900">{grupoSel.descricao}</p>
              ) : null}
              {labelsPerm.length ? (
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {labelsPerm.slice(0, 8).map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                  {labelsPerm.length > 8 ? (
                    <li>… e mais {labelsPerm.length - 8}</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
        <div>
          <label htmlFor="senha" className="mb-1 block text-xs font-medium text-neutral-600">
            {mode === "create" ? "Senha inicial *" : "Nova senha (opcional)"}
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            required={mode === "create"}
            minLength={mode === "create" ? 8 : undefined}
            placeholder={mode === "edit" ? "Deixe em branco para manter" : undefined}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            autoComplete="new-password"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="hidden" name="ativo" value="false" />
            <input
              type="checkbox"
              name="ativo"
              value="true"
              defaultChecked={initial?.ativo ?? true}
            />
            Usuário ativo
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
        >
          {pending ? "Salvando…" : mode === "create" ? "Criar usuário" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/usuarios")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

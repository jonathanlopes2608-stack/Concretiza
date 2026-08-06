"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { PERFIS_ACESSO } from "@/src/lib/grupos";
import {
  CATALOGO_PERMISSOES,
  PERMISSOES_POR_ROLE,
  type PermissaoCodigo,
} from "@/src/lib/permissoes";
import {
  atualizarGrupoAction,
  criarGrupoAction,
} from "@/src/modules/grupos/actions";

type Props = {
  mode: "create" | "edit";
  initial?: {
    id: string;
    codigo: string;
    nome: string;
    descricao: string;
    role: Role;
    permissoes: string[];
    ativo: boolean;
    sistema: boolean;
  };
};

const LOCKED_ADMIN: PermissaoCodigo[] = [
  "tela.usuarios",
  "tela.grupos",
  "acao.usuario.gerenciar",
  "acao.grupo.gerenciar",
];

export function GrupoForm({ mode, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sistema = initial?.sistema ?? false;
  const isAdminSistema = sistema && initial?.codigo === "ADMIN";

  const [permissoes, setPermissoes] = useState<Set<string>>(
    () => new Set(initial?.permissoes?.length ? initial.permissoes : PERMISSOES_POR_ROLE.ANALISTA),
  );

  const telas = useMemo(
    () => CATALOGO_PERMISSOES.filter((p) => p.grupo === "Telas"),
    [],
  );
  const acoes = useMemo(
    () => CATALOGO_PERMISSOES.filter((p) => p.grupo === "Ações"),
    [],
  );

  function toggle(codigo: string) {
    if (isAdminSistema && LOCKED_ADMIN.includes(codigo as PermissaoCodigo)) return;
    setPermissoes((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  }

  function aplicarModelo(role: Role) {
    const base = new Set<string>(PERMISSOES_POR_ROLE[role]);
    if (isAdminSistema) {
      for (const p of LOCKED_ADMIN) base.add(p);
    }
    setPermissoes(base);
  }

  function onSubmit(formData: FormData) {
    setError(null);
    for (const p of permissoes) {
      formData.append("permissoes", p);
    }
    if (isAdminSistema) {
      for (const p of LOCKED_ADMIN) {
        if (![...formData.getAll("permissoes")].includes(p)) {
          formData.append("permissoes", p);
        }
      }
    }
    start(async () => {
      const result =
        mode === "create"
          ? await criarGrupoAction(formData)
          : await atualizarGrupoAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/usuarios/grupos");
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
        <div>
          <label htmlFor="codigo" className="mb-1 block text-xs font-medium text-neutral-600">
            Código *
          </label>
          <input
            id="codigo"
            name="codigo"
            required={mode === "create"}
            disabled={mode === "edit"}
            defaultValue={initial?.codigo ?? ""}
            placeholder="Ex.: ANALISTA_SR"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-neutral-100"
          />
          {mode === "edit" ? (
            <p className="mt-1 text-xs text-neutral-500">Código não pode ser alterado.</p>
          ) : null}
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
        <div className="sm:col-span-2">
          <label htmlFor="descricao" className="mb-1 block text-xs font-medium text-neutral-600">
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows={2}
            defaultValue={initial?.descricao ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-neutral-100/50 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-900">Permissões</p>
            <p className="text-xs text-neutral-600">
              Marque o que este grupo pode ver e executar.
            </p>
          </div>
          <div>
            <label htmlFor="modelo" className="mb-1 block text-xs font-medium text-neutral-600">
              Aplicar modelo
            </label>
            <select
              id="modelo"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as Role | "";
                if (v) aplicarModelo(v);
                e.target.value = "";
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecionar…</option>
              {PERFIS_ACESSO.map((p) => (
                <option key={p.role} value={p.role}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Telas
            </legend>
            <ul className="space-y-2">
              {telas.map((p) => {
                const locked = isAdminSistema && LOCKED_ADMIN.includes(p.codigo);
                const checked = permissoes.has(p.codigo) || locked;
                return (
                  <li key={p.codigo}>
                    <label
                      className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                        checked
                          ? "border-brand-500/40 bg-white"
                          : "border-slate-200 bg-white/60"
                      } ${locked ? "opacity-80" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={checked}
                        disabled={locked}
                        onChange={() => toggle(p.codigo)}
                      />
                      <span>
                        <span className="font-medium text-brand-900">{p.label}</span>
                        {p.descricao ? (
                          <span className="mt-0.5 block text-xs text-neutral-500">{p.descricao}</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Ações
            </legend>
            <ul className="space-y-2">
              {acoes.map((p) => {
                const locked = isAdminSistema && LOCKED_ADMIN.includes(p.codigo);
                const checked = permissoes.has(p.codigo) || locked;
                return (
                  <li key={p.codigo}>
                    <label
                      className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                        checked
                          ? "border-brand-500/40 bg-white"
                          : "border-slate-200 bg-white/60"
                      } ${locked ? "opacity-80" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={checked}
                        disabled={locked}
                        onChange={() => toggle(p.codigo)}
                      />
                      <span className="font-medium text-brand-900">{p.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </div>
        <p className="text-xs text-neutral-500">
          {permissoes.size} permissão(ões) selecionada(s). Ao salvar, o acesso dos usuários do
          grupo é atualizado.
        </p>
      </div>

      {!sistema ? (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="hidden" name="ativo" value="false" />
          <input
            type="checkbox"
            name="ativo"
            value="true"
            defaultChecked={initial?.ativo ?? true}
          />
          Grupo ativo
        </label>
      ) : (
        <input type="hidden" name="ativo" value="true" />
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
        >
          {pending ? "Salvando…" : mode === "create" ? "Criar grupo" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/usuarios/grupos")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

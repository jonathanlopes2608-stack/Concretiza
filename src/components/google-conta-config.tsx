"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  atualizarCalendarGoogleAction,
  desconectarGoogleAction,
  iniciarGoogleOAuthAction,
  sincronizarGoogleAction,
} from "@/src/modules/agenda/actions";

type CalOpt = { id: string; summary: string; primary?: boolean };

type Props = {
  conectado: boolean;
  emailGoogle?: string | null;
  calendarId?: string | null;
  atualizadoEm?: string | null;
  oauthConfigured: boolean;
  calendarios: CalOpt[];
};

export function GoogleContaConfig({
  conectado,
  emailGoogle,
  calendarId,
  atualizadoEm,
  oauthConfigured,
  calendarios,
}: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function sync() {
    setError(null);
    setMsg(null);
    start(async () => {
      const r = await sincronizarGoogleAction();
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setMsg(
        `Sincronizado: ${r.data?.imported ?? 0} novos, ${r.data?.updated ?? 0} atualizados, ${r.data?.removed ?? 0} removidos.`,
      );
      router.refresh();
    });
  }

  function disconnect() {
    if (!confirm("Desconectar Google Calendar? Os compromissos locais permanecem.")) return;
    setError(null);
    start(async () => {
      const r = await desconectarGoogleAction();
      if (!r.ok) setError(r.error);
      else {
        setMsg("Conta Google desconectada.");
        router.refresh();
      }
    });
  }

  function salvarAgenda(formData: FormData) {
    setError(null);
    setMsg(null);
    start(async () => {
      const r = await atualizarCalendarGoogleAction(formData);
      if (!r.ok) setError(r.error);
      else {
        setMsg("Agenda padrão atualizada. A próxima sincronização usará esta agenda.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-surface p-5">
        <h3 className="text-sm font-semibold text-brand-900">Status da conexão</h3>
        {!oauthConfigured ? (
          <p className="mt-2 text-sm text-amber-800">
            O servidor ainda não tem as credenciais Google. Peça ao administrador para configurar
            no <code className="rounded bg-neutral-100 px-1">.env</code>:{" "}
            <code className="rounded bg-neutral-100 px-1">GOOGLE_CLIENT_ID</code>,{" "}
            <code className="rounded bg-neutral-100 px-1">GOOGLE_CLIENT_SECRET</code> e{" "}
            <code className="rounded bg-neutral-100 px-1">TOKEN_ENCRYPTION_KEY</code> (veja{" "}
            <code className="rounded bg-neutral-100 px-1">.env.example</code>).
          </p>
        ) : conectado ? (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-neutral-600">Conta Google</dt>
              <dd className="font-medium text-brand-900">{emailGoogle}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-600">Situação</dt>
              <dd className="font-medium text-green-700">Conectada</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-600">Agenda em uso</dt>
              <dd className="font-mono text-xs text-neutral-800">{calendarId ?? "primary"}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-600">Última atualização do vínculo</dt>
              <dd className="text-neutral-800">{atualizadoEm ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-neutral-700">
            Nenhuma conta Google conectada. Conecte para espelhar compromissos no Calendar.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {oauthConfigured && !conectado ? (
            <form action={iniciarGoogleOAuthAction}>
              <button
                type="submit"
                className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
              >
                Conectar conta Google
              </button>
            </form>
          ) : null}
          {conectado ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={sync}
                className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
              >
                Sincronizar agora
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={disconnect}
                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                Desconectar
              </button>
            </>
          ) : null}
        </div>
        {msg ? <p className="mt-3 text-sm text-green-700">{msg}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      {conectado ? (
        <section className="rounded-lg border border-slate-200 bg-surface p-5">
          <h3 className="text-sm font-semibold text-brand-900">Agenda padrão</h3>
          <p className="mt-1 text-xs text-neutral-600">
            Eventos criados no Concretiza serão gravados nesta agenda do Google.
          </p>
          <form action={salvarAgenda} className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1">
              <label htmlFor="calendarId" className="mb-1 block text-xs font-medium text-neutral-600">
                Calendário
              </label>
              {calendarios.length > 0 ? (
                <select
                  id="calendarId"
                  name="calendarId"
                  defaultValue={calendarId ?? "primary"}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {calendarios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.summary}
                      {c.primary ? " (principal)" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="calendarId"
                  name="calendarId"
                  defaultValue={calendarId ?? "primary"}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              )}
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-neutral-100"
            >
              Salvar agenda
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-surface p-5 text-sm">
        <h3 className="text-sm font-semibold text-brand-900">Atalhos</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-neutral-700">
          <li>
            <Link href="/agenda" className="text-brand-700 hover:underline">
              Abrir agenda
            </Link>
          </li>
          <li>
            <Link href="/agenda/compartilhar" className="text-brand-700 hover:underline">
              Compartilhar visibilidade no Concretiza
            </Link>
          </li>
          <li>
            <Link href="/conta/seguranca" className="text-brand-700 hover:underline">
              Segurança (2FA)
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

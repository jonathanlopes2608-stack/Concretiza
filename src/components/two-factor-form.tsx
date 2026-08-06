"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verify2faAction } from "@/src/modules/auth/actions";

export function TwoFactorForm() {
  const router = useRouter();
  const [totp, setTotp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await verify2faAction({ totp });
    setLoading(false);

    if (result.ok) {
      router.push("/fila");
      router.refresh();
      return;
    }

    setError(result.error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-brand-900">Verificação em duas etapas</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Digite o código de 6 dígitos do seu aplicativo autenticador.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="totp" className="mb-1 block text-sm font-medium text-brand-900">
              Código
            </label>
            <input
              id="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.4em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading || totp.length !== 6}
            className="w-full rounded-md bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {loading ? "Validando..." : "Confirmar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-600">
          <Link href="/login" className="text-brand-700 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}

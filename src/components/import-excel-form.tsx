"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importarExcelAction } from "@/src/modules/propostas/actions";

export function ImportExcelForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [errosLinha, setErrosLinha] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSummary(null);
    setErrosLinha([]);

    const formData = new FormData(e.currentTarget);
    const result = await importarExcelAction(formData);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const { criadas, erros } = result.data!;
    setSummary(`${criadas} proposta(s) importada(s).`);
    setErrosLinha(erros);
    if (criadas > 0) {
      router.refresh();
    }
  }

  return (
    <div className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-surface p-6">
      <p className="text-sm text-neutral-600">
        Use o modelo com os cabeçalhos padrão. Linhas inválidas são ignoradas e listadas abaixo.
      </p>
      <a
        href="/api/propostas/modelo-excel"
        className="inline-block text-sm font-medium text-brand-700 hover:underline"
      >
        Baixar modelo Excel (.xlsx)
      </a>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="file"
          name="arquivo"
          accept=".xlsx,.xls"
          required
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
        >
          {loading ? "Importando..." : "Importar"}
        </button>
      </form>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {summary ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{summary}</p>
      ) : null}
      {errosLinha.length > 0 ? (
        <ul className="max-h-48 list-disc overflow-y-auto rounded-md bg-amber-50 px-5 py-3 text-sm text-amber-900">
          {errosLinha.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

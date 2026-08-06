import Link from "next/link";
import { nomeCompleto } from "@/src/lib/grupos";

const TIPO_LABEL: Record<string, string> = {
  ASSINATURA: "Assinatura",
  RETORNO_PENDENCIA: "Retorno pendência",
  PRAZO: "Prazo",
  OUTRO: "Outro",
};

function fmt(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

type Item = {
  id: string;
  titulo: string;
  tipo: string;
  inicio: Date;
  fim: Date | null;
  origem: string;
  syncErro: string | null;
  usuarioId: string;
  usuario: { id: string; nome: string; sobrenome: string };
  proposta: {
    id: string;
    numeroProcessoInterno: string | null;
    numeroPropostaCaixa: string | null;
    compradorNome: string;
  } | null;
};

export function AgendaLista({
  itens,
  usuarioAtualId,
}: {
  itens: Item[];
  usuarioAtualId: string;
}) {
  if (itens.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-surface px-6 py-12 text-center">
        <p className="font-medium text-brand-900">Nenhum compromisso neste período</p>
        <p className="mt-1 text-sm text-neutral-600">Crie um novo ou sincronize o Google Calendar.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-surface">
      {itens.map((c) => {
        const meu = c.usuarioId === usuarioAtualId;
        const processo =
          c.proposta?.numeroProcessoInterno ||
          c.proposta?.numeroPropostaCaixa ||
          null;
        return (
          <li key={c.id} className="px-4 py-3 hover:bg-neutral-100/50">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/agenda/${c.id}`}
                  className="font-medium text-brand-900 hover:underline"
                >
                  {c.titulo}
                </Link>
                <p className="mt-0.5 text-xs text-neutral-600">
                  {fmt(c.inicio)}
                  {c.fim ? ` → ${fmt(c.fim)}` : ""}
                  {" · "}
                  {TIPO_LABEL[c.tipo] ?? c.tipo}
                  {!meu
                    ? ` · ${nomeCompleto(c.usuario.nome, c.usuario.sobrenome)}`
                    : ""}
                  {c.origem === "GOOGLE" ? " · Google" : ""}
                </p>
                {processo ? (
                  <p className="text-xs text-neutral-500">
                    Processo:{" "}
                    <Link href={`/propostas/${c.proposta!.id}`} className="text-brand-700 hover:underline">
                      {processo}
                    </Link>
                    {c.proposta?.compradorNome ? ` — ${c.proposta.compradorNome}` : ""}
                  </p>
                ) : null}
                {c.syncErro ? (
                  <p className="text-xs text-amber-700">Sync: {c.syncErro}</p>
                ) : null}
              </div>
              <Link
                href={`/agenda/${c.id}`}
                className="text-xs text-brand-700 hover:underline"
              >
                {meu ? "Abrir" : "Ver"}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

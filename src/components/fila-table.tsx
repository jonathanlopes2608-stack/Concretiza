import Link from "next/link";
import type { FaseProcesso } from "@prisma/client";
import { FaseBadge } from "@/src/components/status-badge";
import { FASE_LABELS, isFaseTerminal } from "@/src/lib/fases";
import type {
  FilaDirecao,
  FilaOrdenacao,
  PropostaFila,
} from "@/src/modules/propostas/repository";
import { FILA_ORDENACOES } from "@/src/modules/propostas/repository";

function formatDateTime(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function isSlaAtrasado(prazo: Date | null, fase: FaseProcesso) {
  if (!prazo || isFaseTerminal(fase)) return false;
  return prazo.getTime() < Date.now();
}

function rotuloProcesso(p: PropostaFila) {
  return p.numeroProcessoInterno || p.numeroPropostaCaixa || p.id.slice(0, 8);
}

type TipoOpt = { id: string; label: string };
type AnalistaOpt = { id: string; nome: string };

type Props = {
  propostas: PropostaFila[];
  faseFiltro?: string;
  busca?: string;
  tipoDependenciaId?: string;
  soTravados?: boolean;
  slaEstourado?: boolean;
  tiposDependencia?: TipoOpt[];
  analistas?: AnalistaOpt[];
  analistaId?: string;
  ordenar?: FilaOrdenacao | "";
  dir?: FilaDirecao;
};

const COLUNAS: { key: FilaOrdenacao; label: string }[] = [
  { key: "processo", label: "Processo" },
  { key: "cliente", label: "Cliente" },
  { key: "fase", label: "Fase" },
  { key: "parado", label: "Parado em" },
  { key: "analista", label: "Analista" },
  { key: "despachante", label: "Despachante" },
  { key: "sla", label: "SLA" },
  { key: "entrada", label: "Entrada" },
];

function buildFilaQuery(base: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `/fila?${s}` : "/fila";
}

function SortHeader({
  coluna,
  label,
  atual,
  dir,
  filtros,
}: {
  coluna: FilaOrdenacao;
  label: string;
  atual?: FilaOrdenacao | "";
  dir: FilaDirecao;
  filtros: Record<string, string | undefined>;
}) {
  const ativa = atual === coluna;
  const proximaDir: FilaDirecao = ativa && dir === "asc" ? "desc" : "asc";
  const href = buildFilaQuery({
    ...filtros,
    ordenar: coluna,
    dir: proximaDir,
  });
  const indicador = !ativa ? "↕" : dir === "asc" ? "↑" : "↓";

  return (
    <th className="px-4 py-3 font-medium">
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
          ativa ? "text-brand-900" : "text-neutral-600"
        }`}
        title={
          ativa
            ? `Ordenado ${dir === "asc" ? "crescente" : "decrescente"} — clique para inverter`
            : `Ordenar por ${label}`
        }
        aria-sort={ativa ? (dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        <span className="text-[10px] leading-none opacity-70" aria-hidden>
          {indicador}
        </span>
      </Link>
    </th>
  );
}

export function FilaTable({
  propostas,
  faseFiltro = "",
  busca = "",
  tipoDependenciaId = "",
  soTravados = false,
  slaEstourado = false,
  tiposDependencia = [],
  analistas = [],
  analistaId = "",
  ordenar = "",
  dir = "asc",
}: Props) {
  const filtrosBase: Record<string, string | undefined> = {
    busca: busca || undefined,
    fase: faseFiltro || undefined,
    tipoDependenciaId: tipoDependenciaId || undefined,
    analistaId: analistaId || undefined,
    soTravados: soTravados ? "1" : undefined,
    slaEstourado: slaEstourado ? "1" : undefined,
  };

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-surface p-4">
        {ordenar ? (
          <>
            <input type="hidden" name="ordenar" value={ordenar} />
            <input type="hidden" name="dir" value={dir} />
          </>
        ) : null}
        <div>
          <label htmlFor="busca" className="mb-1 block text-xs font-medium text-neutral-600">
            Busca
          </label>
          <input
            id="busca"
            name="busca"
            defaultValue={busca}
            placeholder="Processo, Caixa, nome, CPF…"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="fase" className="mb-1 block text-xs font-medium text-neutral-600">
            Fase
          </label>
          <select
            id="fase"
            name="fase"
            defaultValue={faseFiltro}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {(Object.keys(FASE_LABELS) as FaseProcesso[]).map((f) => (
              <option key={f} value={f}>
                {FASE_LABELS[f]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tipoDependenciaId" className="mb-1 block text-xs font-medium text-neutral-600">
            Depende de
          </label>
          <select
            id="tipoDependenciaId"
            name="tipoDependenciaId"
            defaultValue={tipoDependenciaId}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {tiposDependencia.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="analistaId" className="mb-1 block text-xs font-medium text-neutral-600">
            Analista
          </label>
          <select
            id="analistaId"
            name="analistaId"
            defaultValue={analistaId}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {analistas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="soTravados" value="1" defaultChecked={soTravados} />
          Só travados
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="slaEstourado" value="1" defaultChecked={slaEstourado} />
          SLA estourado
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
        >
          Filtrar
        </button>
      </form>

      {propostas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-surface px-6 py-16 text-center">
          <p className="text-base font-medium text-brand-900">Nenhuma proposta na fila</p>
          <p className="mt-2 text-sm text-neutral-600">
            Cadastre manualmente ou importe um Excel para começar.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/propostas/nova"
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
            >
              Nova proposta
            </Link>
            <Link
              href="/propostas/importar"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-neutral-100"
            >
              Importar Excel
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-neutral-100 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                {COLUNAS.map((c) => (
                  <SortHeader
                    key={c.key}
                    coluna={c.key}
                    label={c.label}
                    atual={ordenar}
                    dir={dir}
                    filtros={filtrosBase}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {propostas.map((p) => {
                const atrasado = isSlaAtrasado(p.prazoSlaAte, p.faseAtual);
                const parado =
                  p.bloqueiosAbertos[0] != null
                    ? `${p.bloqueiosAbertos[0].tipoDependencia.label}: ${p.bloqueiosAbertos[0].titulo}`
                    : p.bloqueioResumo;
                return (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-neutral-100/60">
                    <td className="px-4 py-3 font-medium text-brand-900">
                      <Link href={`/propostas/${p.id}`} className="hover:underline">
                        {rotuloProcesso(p)}
                      </Link>
                      {p.numeroProcessoInterno && p.numeroPropostaCaixa ? (
                        <div className="text-xs font-normal text-neutral-600">
                          Caixa: {p.numeroPropostaCaixa}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div>{p.compradorNome}</div>
                      <div className="text-xs text-neutral-600">{p.compradorCpf}</div>
                    </td>
                    <td className="px-4 py-3">
                      <FaseBadge fase={p.faseAtual} />
                    </td>
                    <td className="px-4 py-3">
                      {parado ? (
                        <span className="text-amber-800">{parado}</span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{p.analista?.nome ?? "—"}</td>
                    <td className="px-4 py-3">{p.despachanteNome ?? "—"}</td>
                    <td className={`px-4 py-3 ${atrasado ? "font-medium text-red-600" : ""}`}>
                      {formatDateTime(p.prazoSlaAte)}
                    </td>
                    <td className="px-4 py-3">{formatDateTime(p.dataEntrada)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Valida query de ordenação da fila. */
export function parseFilaOrdenacao(
  ordenar?: string,
  dir?: string,
): { ordenar?: FilaOrdenacao; dir: FilaDirecao } {
  const col = FILA_ORDENACOES.includes(ordenar as FilaOrdenacao)
    ? (ordenar as FilaOrdenacao)
    : undefined;
  const direcao: FilaDirecao = dir === "desc" ? "desc" : "asc";
  return { ordenar: col, dir: direcao };
}

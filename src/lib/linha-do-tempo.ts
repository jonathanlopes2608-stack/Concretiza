import type { FaseProcesso } from "@prisma/client";
import { FASE_LABELS } from "@/src/lib/fases";

export type HistoricoLinhaItem = {
  id: string;
  deFase: FaseProcesso | null;
  paraFase: FaseProcesso;
  observacao: string | null;
  createdAt: Date;
};

export type DiaLinhaDoTempo = {
  dataKey: string;
  dataLabel: string;
  eventos: { id: string; texto: string }[];
};

function dataKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dataLabel(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Texto amigável do evento (prioriza observação operacional). */
export function textoEventoHistorico(h: HistoricoLinhaItem): string {
  const obs = h.observacao?.trim();
  if (obs) {
    if (/^proposta criada/i.test(obs)) return "Criação da proposta";
    if (/^bloqueio aberto/i.test(obs)) return obs.replace(/^Bloqueio aberto\s*/i, "Bloqueio: ");
    if (/^bloqueio resolvido/i.test(obs)) return obs;
    if (/atribu/i.test(obs)) return obs;
    return obs;
  }
  if (!h.deFase) return FASE_LABELS[h.paraFase];
  return `${FASE_LABELS[h.deFase]} → ${FASE_LABELS[h.paraFase]}`;
}

/** Agrupa histórico por dia, ordem cronológica (mais antigo → mais recente). */
export function agruparLinhaDoTempo(historicos: HistoricoLinhaItem[]): DiaLinhaDoTempo[] {
  const ordenados = [...historicos].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const map = new Map<string, DiaLinhaDoTempo>();

  for (const h of ordenados) {
    const key = dataKey(h.createdAt);
    let dia = map.get(key);
    if (!dia) {
      dia = { dataKey: key, dataLabel: dataLabel(h.createdAt), eventos: [] };
      map.set(key, dia);
    }
    dia.eventos.push({ id: h.id, texto: textoEventoHistorico(h) });
  }

  return [...map.values()];
}

export function formatAtualizadoEm(d: Date) {
  const data = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  const [hh, mm] = hora.split(":");
  return `Informações atualizadas em ${data} às ${hh}h ${mm}m`;
}

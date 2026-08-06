import type { FaseProcesso } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { FASE_LABELS, isFaseTerminal } from "@/src/lib/fases";
import { listarAnalistasOpcoes } from "@/src/modules/usuarios/service";

export type DashboardMetrics = {
  funil: { fase: FaseProcesso; label: string; total: number }[];
  travadosPorDependencia: { codigo: string; label: string; total: number }[];
  agingFase: { fase: FaseProcesso; label: string; mediaDias: number; total: number }[];
  finalizadosPeriodo: number;
  slaEstourado: number;
  porAnalista: {
    id: string;
    nome: string;
    ativas: number;
    finalizadas: number;
    slaEstourado: number;
  }[];
  periodoDias: number;
};

function daysBetween(from: Date, to: Date) {
  return Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export async function obterMetricasDashboard(periodoDias = 30): Promise<DashboardMetrics> {
  const agora = new Date();
  const inicioPeriodo = new Date(agora);
  inicioPeriodo.setDate(inicioPeriodo.getDate() - periodoDias);

  const [porFase, bloqueiosAbertos, propostasAtivas, historicoFinal, analistas] =
    await Promise.all([
      prisma.proposta.groupBy({
        by: ["faseAtual"],
        _count: { _all: true },
      }),
      prisma.bloqueioProcesso.findMany({
        where: { status: "ABERTO" },
        select: {
          abertoEm: true,
          tipoDependencia: { select: { codigo: true, label: true } },
          proposta: { select: { faseAtual: true } },
        },
      }),
      prisma.proposta.findMany({
        where: { faseAtual: { notIn: ["FINALIZADO", "CANCELADO", "REPROVADA"] } },
        select: {
          id: true,
          faseAtual: true,
          analistaId: true,
          prazoSlaAte: true,
          historicos: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true, paraFase: true },
          },
        },
      }),
      prisma.historicoProposta.count({
        where: {
          paraFase: "FINALIZADO",
          createdAt: { gte: inicioPeriodo },
        },
      }),
      listarAnalistasOpcoes(),
    ]);

  const funilMap = new Map(porFase.map((r) => [r.faseAtual, r._count._all]));
  const funil = (Object.keys(FASE_LABELS) as FaseProcesso[]).map((fase) => ({
    fase,
    label: FASE_LABELS[fase],
    total: funilMap.get(fase) ?? 0,
  }));

  const depCount = new Map<string, { label: string; total: number }>();
  for (const b of bloqueiosAbertos) {
    const key = b.tipoDependencia.codigo;
    const cur = depCount.get(key) ?? { label: b.tipoDependencia.label, total: 0 };
    cur.total += 1;
    depCount.set(key, cur);
  }
  const travadosPorDependencia = [...depCount.entries()]
    .map(([codigo, v]) => ({ codigo, label: v.label, total: v.total }))
    .sort((a, b) => b.total - a.total);

  const agingAcc = new Map<FaseProcesso, { soma: number; n: number }>();
  for (const p of propostasAtivas) {
    if (isFaseTerminal(p.faseAtual)) continue;
    const inicioFase = p.historicos[0]?.createdAt ?? agora;
    const dias = daysBetween(inicioFase, agora);
    const cur = agingAcc.get(p.faseAtual) ?? { soma: 0, n: 0 };
    cur.soma += dias;
    cur.n += 1;
    agingAcc.set(p.faseAtual, cur);
  }
  const agingFase = [...agingAcc.entries()]
    .map(([fase, v]) => ({
      fase,
      label: FASE_LABELS[fase],
      mediaDias: v.n ? Math.round((v.soma / v.n) * 10) / 10 : 0,
      total: v.n,
    }))
    .sort((a, b) => b.mediaDias - a.mediaDias);

  const finalizadosPorAnalista = await prisma.proposta.groupBy({
    by: ["analistaId"],
    where: {
      faseAtual: "FINALIZADO",
      updatedAt: { gte: inicioPeriodo },
    },
    _count: { _all: true },
  });
  const finMap = new Map(
    finalizadosPorAnalista.map((r) => [r.analistaId ?? "", r._count._all]),
  );

  const porAnalista = analistas.map((a) => {
    const ativas = propostasAtivas.filter((p) => p.analistaId === a.id);
    return {
      id: a.id,
      nome: a.nome,
      ativas: ativas.length,
      finalizadas: finMap.get(a.id) ?? 0,
      slaEstourado: ativas.filter(
        (p) => p.prazoSlaAte && p.prazoSlaAte.getTime() < agora.getTime(),
      ).length,
    };
  });

  const slaEstourado = propostasAtivas.filter(
    (p) => p.prazoSlaAte && p.prazoSlaAte.getTime() < agora.getTime(),
  ).length;

  return {
    funil,
    travadosPorDependencia,
    agingFase,
    finalizadosPeriodo: historicoFinal,
    slaEstourado,
    porAnalista,
    periodoDias,
  };
}

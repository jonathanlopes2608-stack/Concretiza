import type { FaseProcesso, Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { nomeCompleto } from "@/src/lib/grupos";

export const FILA_ORDENACOES = [
  "processo",
  "cliente",
  "fase",
  "parado",
  "analista",
  "despachante",
  "sla",
  "entrada",
] as const;

export type FilaOrdenacao = (typeof FILA_ORDENACOES)[number];
export type FilaDirecao = "asc" | "desc";

export type FilaFiltros = {
  fase?: FaseProcesso;
  analistaId?: string;
  tipoDependenciaId?: string;
  soTravados?: boolean;
  slaEstourado?: boolean;
  busca?: string;
  ordenar?: FilaOrdenacao;
  dir?: FilaDirecao;
};

function orderByFila(
  ordenar?: FilaOrdenacao,
  dir: FilaDirecao = "asc",
): Prisma.PropostaOrderByWithRelationInput[] {
  const secondary: Prisma.PropostaOrderByWithRelationInput = { dataEntrada: "asc" };

  switch (ordenar) {
    case "processo":
      return [{ numeroProcessoInterno: dir }, { numeroPropostaCaixa: dir }, secondary];
    case "cliente":
      return [{ compradorNome: dir }, secondary];
    case "fase":
      return [{ faseAtual: dir }, secondary];
    case "parado":
      return [{ bloqueioResumo: dir }, secondary];
    case "analista":
      return [{ analista: { nome: dir } }, secondary];
    case "despachante":
      return [{ despachanteNome: dir }, secondary];
    case "sla":
      return [{ prazoSlaAte: dir }, secondary];
    case "entrada":
      return [{ dataEntrada: dir }];
    default:
      return [{ prioridade: "desc" }, { prazoSlaAte: "asc" }, { dataEntrada: "asc" }];
  }
}

export type PropostaFila = {
  id: string;
  numeroPropostaCaixa: string | null;
  numeroProcessoInterno: string | null;
  faseAtual: FaseProcesso;
  prioridade: string;
  modalidade: string;
  compradorNome: string;
  compradorCpf: string;
  despachanteNome: string | null;
  bloqueioResumo: string | null;
  dataEntrada: Date;
  prazoSlaAte: Date | null;
  imobiliaria: string | null;
  analista: { id: string; nome: string } | null;
  bloqueiosAbertos: {
    id: string;
    titulo: string;
    tipoDependencia: { id: string; label: string; codigo: string };
  }[];
};

export async function listarFila(filtros: FilaFiltros = {}): Promise<PropostaFila[]> {
  const where: Prisma.PropostaWhereInput = {};

  if (filtros.fase) where.faseAtual = filtros.fase;
  if (filtros.analistaId) where.analistaId = filtros.analistaId;
  if (filtros.soTravados || filtros.tipoDependenciaId) {
    where.bloqueios = {
      some: {
        status: "ABERTO",
        ...(filtros.tipoDependenciaId
          ? { tipoDependenciaId: filtros.tipoDependenciaId }
          : {}),
      },
    };
  }
  if (filtros.slaEstourado) {
    where.prazoSlaAte = { lt: new Date() };
    if (!filtros.fase) {
      where.faseAtual = { notIn: ["FINALIZADO", "CANCELADO", "REPROVADA"] };
    }
  }
  if (filtros.busca?.trim()) {
    const q = filtros.busca.trim();
    where.OR = [
      { numeroPropostaCaixa: { contains: q, mode: "insensitive" } },
      { numeroProcessoInterno: { contains: q, mode: "insensitive" } },
      { compradorNome: { contains: q, mode: "insensitive" } },
      { compradorCpf: { contains: q } },
      { despachanteNome: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.proposta.findMany({
    where,
    orderBy: orderByFila(filtros.ordenar, filtros.dir ?? "asc"),
    select: {
      id: true,
      numeroPropostaCaixa: true,
      numeroProcessoInterno: true,
      faseAtual: true,
      prioridade: true,
      modalidade: true,
      compradorNome: true,
      compradorCpf: true,
      despachanteNome: true,
      bloqueioResumo: true,
      dataEntrada: true,
      prazoSlaAte: true,
      imobiliaria: true,
      analista: { select: { id: true, nome: true, sobrenome: true } },
      bloqueios: {
        where: { status: "ABERTO" },
        orderBy: { abertoEm: "asc" },
        take: 3,
        select: {
          id: true,
          titulo: true,
          tipoDependencia: { select: { id: true, label: true, codigo: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    ...r,
    analista: r.analista
      ? { id: r.analista.id, nome: nomeCompleto(r.analista.nome, r.analista.sobrenome) }
      : null,
    bloqueiosAbertos: r.bloqueios,
  }));
}

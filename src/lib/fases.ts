import type { FaseProcesso, Role } from "@prisma/client";

export const FASES_ORDEM: FaseProcesso[] = [
  "ENTRADA",
  "ANALISE",
  "RESTRICAO",
  "ENGENHARIA",
  "DEBITO_FGTS",
  "CONFORMIDADE",
  "DECISAO",
  "EM_CARTORIO",
  "FORMALIZACAO",
  "FINALIZADO",
];

export const FASES_TERMINAIS: FaseProcesso[] = ["FINALIZADO", "CANCELADO", "REPROVADA"];

export const FASE_LABELS: Record<FaseProcesso, string> = {
  ENTRADA: "Entrada",
  ANALISE: "Análise",
  RESTRICAO: "Restrição",
  ENGENHARIA: "Engenharia",
  DEBITO_FGTS: "Débito FGTS",
  CONFORMIDADE: "Conformidade",
  DECISAO: "Decisão",
  EM_CARTORIO: "Em cartório",
  FORMALIZACAO: "Formalização",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
  REPROVADA: "Reprovada",
};

/** Fluxo linear habitual + desvios comuns da planilha. */
const TRANSICOES_ANALISTA: Partial<Record<FaseProcesso, FaseProcesso[]>> = {
  ENTRADA: ["ANALISE"],
  ANALISE: ["RESTRICAO", "ENGENHARIA", "CONFORMIDADE", "DECISAO", "CANCELADO", "REPROVADA"],
  RESTRICAO: ["ANALISE", "ENGENHARIA", "CANCELADO", "REPROVADA"],
  ENGENHARIA: ["DEBITO_FGTS", "CONFORMIDADE", "DECISAO", "ANALISE", "CANCELADO"],
  DEBITO_FGTS: ["CONFORMIDADE", "ENGENHARIA", "DECISAO", "CANCELADO"],
  CONFORMIDADE: ["DECISAO", "FORMALIZACAO", "EM_CARTORIO", "ENGENHARIA", "CANCELADO", "REPROVADA"],
  DECISAO: ["CONFORMIDADE", "ENGENHARIA", "FORMALIZACAO", "EM_CARTORIO", "CANCELADO"],
  EM_CARTORIO: ["FORMALIZACAO", "FINALIZADO", "CONFORMIDADE"],
  FORMALIZACAO: ["EM_CARTORIO", "FINALIZADO"],
};

const ROLES_LIVRE: Role[] = ["ADMIN", "COORDENADOR"];

export function fasesPermitidas(de: FaseProcesso, role: Role): FaseProcesso[] {
  if (ROLES_LIVRE.includes(role)) {
    return (Object.keys(FASE_LABELS) as FaseProcesso[]).filter((f) => f !== de);
  }
  if (role === "ANALISTA") {
    return TRANSICOES_ANALISTA[de] ?? [];
  }
  return [];
}

export function podeForcarComBloqueio(role: Role) {
  return ROLES_LIVRE.includes(role);
}

export function isFaseTerminal(fase: FaseProcesso) {
  return FASES_TERMINAIS.includes(fase);
}

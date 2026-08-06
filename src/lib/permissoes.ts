import type { Role } from "@prisma/client";

export const PERMISSAO_CODIGOS = [
  // Telas
  "tela.fila",
  "tela.dashboard",
  "tela.usuarios",
  "tela.grupos",
  "tela.dependencias",
  "tela.agenda",
  "tela.seguranca",
  // Ações
  "acao.proposta.criar",
  "acao.proposta.editar",
  "acao.proposta.importar",
  "acao.checklist.editar",
  "acao.bloqueio.abrir",
  "acao.bloqueio.resolver",
  "acao.pipeline.transicionar",
  "acao.pipeline.forcar",
  "acao.proposta.reatribuir",
  "acao.dependencia.gerenciar",
  "acao.usuario.gerenciar",
  "acao.grupo.gerenciar",
  "acao.agenda.criar",
  "acao.agenda.editar",
  "acao.agenda.compartilhar",
] as const;

export type PermissaoCodigo = (typeof PERMISSAO_CODIGOS)[number];

export type PermissaoDef = {
  codigo: PermissaoCodigo;
  label: string;
  grupo: "Telas" | "Ações";
  descricao?: string;
};

export const CATALOGO_PERMISSOES: PermissaoDef[] = [
  { codigo: "tela.fila", label: "Fila de processos", grupo: "Telas" },
  { codigo: "tela.dashboard", label: "Dashboard", grupo: "Telas" },
  { codigo: "tela.usuarios", label: "Gestão de usuários", grupo: "Telas" },
  { codigo: "tela.grupos", label: "Gestão de grupos", grupo: "Telas" },
  { codigo: "tela.dependencias", label: "Tipos de dependência", grupo: "Telas" },
  { codigo: "tela.agenda", label: "Agenda", grupo: "Telas" },
  { codigo: "tela.seguranca", label: "Segurança da conta (2FA)", grupo: "Telas" },
  {
    codigo: "acao.proposta.criar",
    label: "Criar proposta",
    grupo: "Ações",
  },
  {
    codigo: "acao.proposta.editar",
    label: "Editar proposta",
    grupo: "Ações",
  },
  {
    codigo: "acao.proposta.importar",
    label: "Importar Excel",
    grupo: "Ações",
  },
  {
    codigo: "acao.checklist.editar",
    label: "Alterar checklist / anexos",
    grupo: "Ações",
  },
  {
    codigo: "acao.bloqueio.abrir",
    label: "Abrir bloqueio",
    grupo: "Ações",
  },
  {
    codigo: "acao.bloqueio.resolver",
    label: "Resolver bloqueio",
    grupo: "Ações",
  },
  {
    codigo: "acao.pipeline.transicionar",
    label: "Avançar fase do processo",
    grupo: "Ações",
  },
  {
    codigo: "acao.pipeline.forcar",
    label: "Forçar avanço com bloqueio aberto",
    grupo: "Ações",
  },
  {
    codigo: "acao.proposta.reatribuir",
    label: "Reatribuir analista",
    grupo: "Ações",
  },
  {
    codigo: "acao.dependencia.gerenciar",
    label: "Gerenciar tipos de dependência",
    grupo: "Ações",
  },
  {
    codigo: "acao.usuario.gerenciar",
    label: "Gerenciar usuários",
    grupo: "Ações",
  },
  {
    codigo: "acao.grupo.gerenciar",
    label: "Gerenciar grupos",
    grupo: "Ações",
  },
  {
    codigo: "acao.agenda.criar",
    label: "Criar compromisso na agenda",
    grupo: "Ações",
  },
  {
    codigo: "acao.agenda.editar",
    label: "Editar / excluir compromisso",
    grupo: "Ações",
  },
  {
    codigo: "acao.agenda.compartilhar",
    label: "Compartilhar visibilidade da agenda",
    grupo: "Ações",
  },
];

export const PERMISSOES_POR_ROLE: Record<Role, PermissaoCodigo[]> = {
  ADMIN: [...PERMISSAO_CODIGOS],
  COORDENADOR: [
    "tela.fila",
    "tela.dashboard",
    "tela.dependencias",
    "tela.agenda",
    "tela.seguranca",
    "acao.proposta.criar",
    "acao.proposta.editar",
    "acao.proposta.importar",
    "acao.checklist.editar",
    "acao.bloqueio.abrir",
    "acao.bloqueio.resolver",
    "acao.pipeline.transicionar",
    "acao.pipeline.forcar",
    "acao.proposta.reatribuir",
    "acao.dependencia.gerenciar",
    "acao.agenda.criar",
    "acao.agenda.editar",
    "acao.agenda.compartilhar",
  ],
  ANALISTA: [
    "tela.fila",
    "tela.agenda",
    "tela.seguranca",
    "acao.proposta.criar",
    "acao.proposta.editar",
    "acao.proposta.importar",
    "acao.checklist.editar",
    "acao.bloqueio.abrir",
    "acao.bloqueio.resolver",
    "acao.pipeline.transicionar",
    "acao.agenda.criar",
    "acao.agenda.editar",
    "acao.agenda.compartilhar",
  ],
  VISUALIZACAO: ["tela.fila", "tela.dashboard", "tela.agenda", "tela.seguranca"],
};

const SET_VALID = new Set<string>(PERMISSAO_CODIGOS);

export function normalizarPermissoes(raw: unknown): PermissaoCodigo[] {
  if (!Array.isArray(raw)) return [];
  const out: PermissaoCodigo[] = [];
  for (const item of raw) {
    if (typeof item === "string" && SET_VALID.has(item)) {
      out.push(item as PermissaoCodigo);
    }
  }
  return [...new Set(out)];
}

/** Deriva o Role legado a partir das permissões (compatível com requireRoles). */
export function roleFromPermissoes(perms: PermissaoCodigo[]): Role {
  const set = new Set(perms);
  if (set.has("acao.usuario.gerenciar") || set.has("acao.grupo.gerenciar") || set.has("tela.usuarios")) {
    return "ADMIN";
  }
  if (
    set.has("acao.pipeline.forcar") ||
    set.has("acao.proposta.reatribuir") ||
    set.has("acao.dependencia.gerenciar") ||
    set.has("tela.dependencias")
  ) {
    return "COORDENADOR";
  }
  if (
    set.has("acao.proposta.editar") ||
    set.has("acao.checklist.editar") ||
    set.has("acao.bloqueio.abrir") ||
    set.has("acao.pipeline.transicionar")
  ) {
    return "ANALISTA";
  }
  return "VISUALIZACAO";
}

export function temPermissao(
  perms: readonly string[] | undefined | null,
  codigo: PermissaoCodigo,
) {
  return Boolean(perms?.includes(codigo));
}

export function temAlgumaPermissao(
  perms: readonly string[] | undefined | null,
  codigos: PermissaoCodigo[],
) {
  return codigos.some((c) => temPermissao(perms, c));
}

import type { Role } from "@prisma/client";
import { PERMISSOES_POR_ROLE } from "./permissoes";

/** Modelos rápidos (preenchem checkboxes). */
export const PERFIS_ACESSO: {
  role: Role;
  label: string;
  descricao: string;
}[] = [
  {
    role: "ADMIN",
    label: "Administrador",
    descricao: "Acesso total à configuração e operação.",
  },
  {
    role: "COORDENADOR",
    label: "Coordenador",
    descricao: "Opera a fila e acompanha produtividade.",
  },
  {
    role: "ANALISTA",
    label: "Analista",
    descricao: "Executa a conformidade dos processos atribuídos.",
  },
  {
    role: "VISUALIZACAO",
    label: "Visualização",
    descricao: "Somente consulta — sem alterar dados.",
  },
];

export const PERFIL_LABELS: Record<Role, string> = Object.fromEntries(
  PERFIS_ACESSO.map((p) => [p.role, p.label]),
) as Record<Role, string>;

export function nomeCompleto(nome: string, sobrenome?: string | null) {
  return [nome, sobrenome].filter((p) => p && p.trim()).join(" ").trim();
}

export function labelPerfil(role: Role) {
  return PERFIL_LABELS[role] ?? role;
}

export function labelGrupo(role: Role) {
  return labelPerfil(role);
}

export function perfilPorRole(role: Role) {
  return PERFIS_ACESSO.find((p) => p.role === role);
}

/** Grupos padrão do seed (sistema). */
export const GRUPOS_SISTEMA_SEED = PERFIS_ACESSO.map((p) => ({
  codigo: p.role,
  nome: p.label,
  descricao: p.descricao,
  role: p.role,
  permissoes: PERMISSOES_POR_ROLE[p.role],
}));

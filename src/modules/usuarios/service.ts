import { hash } from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { nomeCompleto } from "@/src/lib/grupos";
import {
  usuarioCreateSchema,
  usuarioUpdateSchema,
} from "@/src/modules/usuarios/schema";

export type UsuarioLista = {
  id: string;
  email: string;
  nome: string;
  sobrenome: string;
  nomeCompleto: string;
  role: Role;
  grupoId: string | null;
  grupoNome: string | null;
  ativo: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
};

async function resolverGrupoAtivo(grupoId: string) {
  const grupo = await prisma.grupoUsuario.findUnique({ where: { id: grupoId } });
  if (!grupo) throw new Error("Grupo de usuário não encontrado");
  if (!grupo.ativo) throw new Error("Grupo de usuário está inativo");
  return grupo;
}

export async function listarUsuarios(): Promise<UsuarioLista[]> {
  const rows = await prisma.usuario.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }, { sobrenome: "asc" }],
    select: {
      id: true,
      email: true,
      nome: true,
      sobrenome: true,
      role: true,
      grupoId: true,
      ativo: true,
      twoFactorEnabled: true,
      createdAt: true,
      grupo: { select: { nome: true } },
    },
  });
  return rows.map((u) => ({
    ...u,
    grupoNome: u.grupo?.nome ?? null,
    nomeCompleto: nomeCompleto(u.nome, u.sobrenome),
  }));
}

export async function buscarUsuarioPorId(id: string) {
  const u = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      nome: true,
      sobrenome: true,
      role: true,
      grupoId: true,
      ativo: true,
      twoFactorEnabled: true,
      createdAt: true,
      grupo: { select: { id: true, nome: true, role: true } },
    },
  });
  if (!u) return null;
  return { ...u, nomeCompleto: nomeCompleto(u.nome, u.sobrenome) };
}

export async function criarUsuario(data: unknown) {
  const parsed = usuarioCreateSchema.parse(data);
  const exists = await prisma.usuario.findUnique({
    where: { email: parsed.email },
    select: { id: true },
  });
  if (exists) throw new Error("Já existe usuário com este e-mail");

  const grupo = await resolverGrupoAtivo(parsed.grupoId);
  const senhaHash = await hash(parsed.senha, 12);
  return prisma.usuario.create({
    data: {
      email: parsed.email,
      nome: parsed.nome,
      sobrenome: parsed.sobrenome,
      grupoId: grupo.id,
      role: grupo.role,
      ativo: parsed.ativo,
      senhaHash,
      twoFactorEnabled: false,
    },
  });
}

export async function atualizarUsuario(data: unknown, atorId: string) {
  const parsed = usuarioUpdateSchema.parse(data);
  const atual = await prisma.usuario.findUnique({ where: { id: parsed.id } });
  if (!atual) throw new Error("Usuário não encontrado");

  const grupo = await resolverGrupoAtivo(parsed.grupoId);

  if (parsed.id === atorId && !parsed.ativo) {
    throw new Error("Você não pode desativar a própria conta");
  }
  if (parsed.id === atorId && grupo.role !== "ADMIN" && atual.role === "ADMIN") {
    throw new Error("Você não pode remover o próprio acesso de Administrador");
  }

  const emailTaken = await prisma.usuario.findFirst({
    where: { email: parsed.email, NOT: { id: parsed.id } },
    select: { id: true },
  });
  if (emailTaken) throw new Error("Já existe usuário com este e-mail");

  if (atual.role === "ADMIN" && grupo.role !== "ADMIN") {
    const outrosAdmins = await prisma.usuario.count({
      where: { role: "ADMIN", ativo: true, NOT: { id: parsed.id } },
    });
    if (outrosAdmins === 0) {
      throw new Error("É necessário manter ao menos um administrador ativo");
    }
  }

  if (!parsed.ativo && atual.role === "ADMIN" && atual.ativo) {
    const outrosAdmins = await prisma.usuario.count({
      where: { role: "ADMIN", ativo: true, NOT: { id: parsed.id } },
    });
    if (outrosAdmins === 0) {
      throw new Error("É necessário manter ao menos um administrador ativo");
    }
  }

  const senhaHash = parsed.senha ? await hash(parsed.senha, 12) : undefined;

  return prisma.usuario.update({
    where: { id: parsed.id },
    data: {
      email: parsed.email,
      nome: parsed.nome,
      sobrenome: parsed.sobrenome,
      grupoId: grupo.id,
      role: grupo.role,
      ativo: parsed.ativo,
      ...(senhaHash ? { senhaHash } : {}),
    },
  });
}

export async function listarAnalistasOpcoes() {
  const rows = await prisma.usuario.findMany({
    where: { ativo: true, role: { in: ["ANALISTA", "COORDENADOR", "ADMIN"] } },
    select: { id: true, nome: true, sobrenome: true },
    orderBy: [{ nome: "asc" }, { sobrenome: "asc" }],
  });
  return rows.map((u) => ({
    id: u.id,
    nome: nomeCompleto(u.nome, u.sobrenome),
  }));
}

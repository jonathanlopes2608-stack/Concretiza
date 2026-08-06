import type { Role } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { GRUPOS_SISTEMA_SEED } from "@/src/lib/grupos";
import {
  normalizarPermissoes,
  roleFromPermissoes,
  type PermissaoCodigo,
} from "@/src/lib/permissoes";
import {
  grupoCreateSchema,
  grupoUpdateSchema,
} from "@/src/modules/grupos/schema";

export type GrupoLista = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  role: Role;
  permissoes: string[];
  ativo: boolean;
  sistema: boolean;
  _count: { usuarios: number };
};

export async function garantirGruposSistema() {
  for (const g of GRUPOS_SISTEMA_SEED) {
    const existente = await prisma.grupoUsuario.findUnique({
      where: { codigo: g.codigo },
      select: { id: true, permissoes: true },
    });
    if (!existente) {
      await prisma.grupoUsuario.create({
        data: {
          codigo: g.codigo,
          nome: g.nome,
          descricao: g.descricao,
          role: g.role,
          permissoes: g.permissoes,
          sistema: true,
          ativo: true,
        },
      });
      continue;
    }
    // Só preenche permissões se ainda estiver vazio (migração)
    if (!existente.permissoes?.length) {
      await prisma.grupoUsuario.update({
        where: { id: existente.id },
        data: { permissoes: g.permissoes, role: g.role },
      });
    }
  }
}

export async function vincularUsuariosSemGrupo() {
  const grupos = await prisma.grupoUsuario.findMany({
    where: { sistema: true },
    select: { id: true, role: true },
  });
  const byRole = new Map(grupos.map((g) => [g.role, g.id]));
  const semGrupo = await prisma.usuario.findMany({
    where: { grupoId: null },
    select: { id: true, role: true },
  });
  for (const u of semGrupo) {
    const grupoId = byRole.get(u.role);
    if (!grupoId) continue;
    await prisma.usuario.update({
      where: { id: u.id },
      data: { grupoId },
    });
  }
}

export async function listarGrupos(apenasAtivos = false): Promise<GrupoLista[]> {
  return prisma.grupoUsuario.findMany({
    where: apenasAtivos ? { ativo: true } : undefined,
    orderBy: [{ sistema: "desc" }, { nome: "asc" }],
    include: { _count: { select: { usuarios: true } } },
  });
}

export async function buscarGrupoPorId(id: string) {
  return prisma.grupoUsuario.findUnique({
    where: { id },
    include: { _count: { select: { usuarios: true } } },
  });
}

function assertPermissoesValidas(permissoes: PermissaoCodigo[], sistemaAdmin: boolean) {
  if (sistemaAdmin) {
    const obrigatorias: PermissaoCodigo[] = [
      "tela.usuarios",
      "tela.grupos",
      "acao.usuario.gerenciar",
      "acao.grupo.gerenciar",
    ];
    for (const p of obrigatorias) {
      if (!permissoes.includes(p)) {
        throw new Error(
          "O grupo Administrador de sistema deve manter gestão de usuários e grupos",
        );
      }
    }
  }
}

export async function criarGrupo(data: unknown) {
  const parsed = grupoCreateSchema.parse(data);
  const permissoes = normalizarPermissoes(parsed.permissoes);
  if (permissoes.length === 0) {
    throw new Error("Marque ao menos uma permissão (tela ou ação)");
  }
  const role = roleFromPermissoes(permissoes);

  const exists = await prisma.grupoUsuario.findUnique({
    where: { codigo: parsed.codigo },
    select: { id: true },
  });
  if (exists) throw new Error("Já existe um grupo com este código");

  return prisma.grupoUsuario.create({
    data: {
      codigo: parsed.codigo,
      nome: parsed.nome,
      descricao: parsed.descricao,
      role,
      permissoes,
      ativo: parsed.ativo,
      sistema: false,
    },
  });
}

export async function atualizarGrupo(data: unknown) {
  const parsed = grupoUpdateSchema.parse(data);
  const atual = await prisma.grupoUsuario.findUnique({ where: { id: parsed.id } });
  if (!atual) throw new Error("Grupo não encontrado");

  if (atual.sistema && !parsed.ativo) {
    throw new Error("Grupos de sistema não podem ser desativados");
  }

  const permissoes = normalizarPermissoes(parsed.permissoes);
  if (permissoes.length === 0) {
    throw new Error("Marque ao menos uma permissão (tela ou ação)");
  }

  assertPermissoesValidas(permissoes, atual.sistema && atual.codigo === "ADMIN");

  const role = roleFromPermissoes(permissoes);

  if (atual.role === "ADMIN" && role !== "ADMIN") {
    const adminsFora = await prisma.usuario.count({
      where: {
        role: "ADMIN",
        ativo: true,
        OR: [{ grupoId: null }, { grupoId: { not: parsed.id } }],
      },
    });
    if (adminsFora === 0) {
      const nesteGrupo = await prisma.usuario.count({
        where: { grupoId: parsed.id, ativo: true },
      });
      if (nesteGrupo > 0) {
        throw new Error(
          "Mantenha permissões de administrador enquanto houver usuários só neste grupo",
        );
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const grupo = await tx.grupoUsuario.update({
      where: { id: parsed.id },
      data: {
        nome: parsed.nome,
        descricao: parsed.descricao,
        role,
        permissoes,
        ativo: parsed.ativo,
      },
    });
    await tx.usuario.updateMany({
      where: { grupoId: grupo.id },
      data: { role: grupo.role },
    });
    return grupo;
  });
}

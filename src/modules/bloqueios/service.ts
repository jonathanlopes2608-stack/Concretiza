import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/src/lib/db";

export const abrirBloqueioSchema = z.object({
  propostaId: z.string().min(1),
  tipoDependenciaId: z.string().min(1),
  titulo: z.string().trim().min(3, "Informe o que precisa para seguir"),
  descricao: z.string().trim().optional(),
  origem: z.enum(["MANUAL", "CHECKLIST", "SISTEMA"]).default("MANUAL"),
  checklistRespostaId: z.string().optional(),
});

export const tipoDependenciaSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((v) => v.toUpperCase().replace(/\s+/g, "_")),
  label: z.string().trim().min(2, "Informe o nome"),
});

async function atualizarResumoBloqueio(propostaId: string) {
  const aberto = await prisma.bloqueioProcesso.findFirst({
    where: { propostaId, status: "ABERTO" },
    orderBy: { abertoEm: "asc" },
    include: { tipoDependencia: { select: { label: true } } },
  });
  await prisma.proposta.update({
    where: { id: propostaId },
    data: {
      bloqueioResumo: aberto
        ? `${aberto.tipoDependencia.label}: ${aberto.titulo}`
        : null,
    },
  });
}

export async function listarTiposDependencia(apenasAtivos = true) {
  return prisma.tipoDependencia.findMany({
    where: apenasAtivos ? { ativo: true } : undefined,
    orderBy: { label: "asc" },
  });
}

export async function criarTipoDependencia(data: unknown) {
  const parsed = tipoDependenciaSchema.parse(data);
  return prisma.tipoDependencia.create({
    data: {
      codigo: parsed.codigo,
      label: parsed.label,
      sistema: false,
      ativo: true,
    },
  });
}

export async function atualizarTipoDependencia(
  id: string,
  data: { label?: string; ativo?: boolean },
) {
  const atual = await prisma.tipoDependencia.findUnique({ where: { id } });
  if (!atual) throw new Error("Tipo não encontrado");
  return prisma.tipoDependencia.update({
    where: { id },
    data: {
      label: data.label?.trim() || undefined,
      ativo: data.ativo,
    },
  });
}

export async function listarBloqueiosProposta(propostaId: string) {
  return prisma.bloqueioProcesso.findMany({
    where: { propostaId },
    orderBy: [{ status: "asc" }, { abertoEm: "desc" }],
    include: {
      tipoDependencia: true,
      abertoPor: { select: { id: true, nome: true } },
      resolvidoPor: { select: { id: true, nome: true } },
    },
  });
}

export async function abrirBloqueio(data: unknown, usuarioId: string, _role: Role) {
  const parsed = abrirBloqueioSchema.parse(data);
  const tipo = await prisma.tipoDependencia.findFirst({
    where: { id: parsed.tipoDependenciaId, ativo: true },
  });
  if (!tipo) throw new Error("Tipo de dependência inválido");

  const proposta = await prisma.proposta.findUnique({
    where: { id: parsed.propostaId },
    select: { id: true, faseAtual: true },
  });
  if (!proposta) throw new Error("Proposta não encontrada");

  const bloqueio = await prisma.bloqueioProcesso.create({
    data: {
      propostaId: parsed.propostaId,
      tipoDependenciaId: parsed.tipoDependenciaId,
      titulo: parsed.titulo.trim(),
      descricao: parsed.descricao?.trim() || null,
      origem: parsed.origem,
      checklistRespostaId: parsed.checklistRespostaId ?? null,
      abertoPorId: usuarioId,
      status: "ABERTO",
    },
  });

  await prisma.historicoProposta.create({
    data: {
      propostaId: parsed.propostaId,
      deFase: proposta.faseAtual,
      paraFase: proposta.faseAtual,
      observacao: `Bloqueio aberto (${tipo.label}): ${parsed.titulo.trim()}`,
      usuarioId,
    },
  });

  await atualizarResumoBloqueio(parsed.propostaId);
  return bloqueio;
}

export async function resolverBloqueio(
  bloqueioId: string,
  usuarioId: string,
  _role: Role,
  observacao?: string,
) {
  const bloqueio = await prisma.bloqueioProcesso.findUnique({
    where: { id: bloqueioId },
    include: { tipoDependencia: true },
  });
  if (!bloqueio) throw new Error("Bloqueio não encontrado");
  if (bloqueio.status === "RESOLVIDO") throw new Error("Bloqueio já resolvido");

  const updated = await prisma.bloqueioProcesso.update({
    where: { id: bloqueioId },
    data: {
      status: "RESOLVIDO",
      resolvidoPorId: usuarioId,
      resolvidoEm: new Date(),
    },
  });

  const fase = (
    await prisma.proposta.findUniqueOrThrow({
      where: { id: bloqueio.propostaId },
      select: { faseAtual: true },
    })
  ).faseAtual;

  await prisma.historicoProposta.create({
    data: {
      propostaId: bloqueio.propostaId,
      deFase: fase,
      paraFase: fase,
      observacao: [
        `Bloqueio resolvido (${bloqueio.tipoDependencia.label}): ${bloqueio.titulo}`,
        observacao?.trim(),
      ]
        .filter(Boolean)
        .join(" · "),
      usuarioId,
    },
  });

  await atualizarResumoBloqueio(bloqueio.propostaId);
  return updated;
}

export async function abrirBloqueioPorChecklist(
  propostaId: string,
  checklistRespostaId: string,
  titulo: string,
  usuarioId: string,
) {
  const existente = await prisma.bloqueioProcesso.findFirst({
    where: {
      propostaId,
      checklistRespostaId,
      status: "ABERTO",
      origem: "CHECKLIST",
    },
  });
  if (existente) return existente;

  const tipo = await prisma.tipoDependencia.findFirst({
    where: { codigo: "CLIENTE", ativo: true },
  });
  if (!tipo) return null;

  return abrirBloqueio(
    {
      propostaId,
      tipoDependenciaId: tipo.id,
      titulo,
      origem: "CHECKLIST",
      checklistRespostaId,
    },
    usuarioId,
    "ANALISTA",
  );
}

export async function resolverBloqueiosChecklistItem(
  checklistRespostaId: string,
  usuarioId: string,
) {
  const abertos = await prisma.bloqueioProcesso.findMany({
    where: {
      checklistRespostaId,
      status: "ABERTO",
      origem: "CHECKLIST",
    },
  });
  for (const b of abertos) {
    await resolverBloqueio(b.id, usuarioId, "ANALISTA");
  }
}

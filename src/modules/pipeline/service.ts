import { z } from "zod";
import type { FaseProcesso, Role } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { calcularPrazoSla } from "@/src/lib/sla";
import {
  fasesPermitidas,
  isFaseTerminal,
  podeForcarComBloqueio,
} from "@/src/lib/fases";

export const transicaoFaseSchema = z.object({
  propostaId: z.string().min(1),
  novaFase: z.enum([
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
    "CANCELADO",
    "REPROVADA",
  ]),
  observacao: z.string().trim().optional(),
  motivo: z.string().trim().optional(),
  forcarComBloqueio: z.boolean().optional(),
});

export type TransicaoFaseInput = z.infer<typeof transicaoFaseSchema>;

async function checklistCompleto(propostaId: string) {
  const itens = await prisma.checklistResposta.findMany({
    where: { propostaId },
    select: { status: true },
  });
  if (itens.length === 0) return true;
  return itens.every((i) => i.status === "OK");
}

export async function transicionarFase(
  input: TransicaoFaseInput,
  usuarioId: string,
  role: Role,
) {
  const parsed = transicaoFaseSchema.parse(input);
  const proposta = await prisma.proposta.findUnique({
    where: { id: parsed.propostaId },
    select: {
      id: true,
      faseAtual: true,
      bloqueios: { where: { status: "ABERTO" }, select: { id: true } },
    },
  });
  if (!proposta) throw new Error("Proposta não encontrada");

  const de = proposta.faseAtual;
  const para = parsed.novaFase as FaseProcesso;
  if (de === para) throw new Error("A proposta já está nesta fase");

  const permitidas = fasesPermitidas(de, role);
  if (!permitidas.includes(para)) {
    throw new Error("Transição de fase não permitida para o seu perfil");
  }

  if (para === "CANCELADO" || para === "REPROVADA") {
    if (!parsed.motivo?.trim()) {
      throw new Error("Informe o motivo do cancelamento/reprovação");
    }
  }

  if (para === "FINALIZADO") {
    const abertos = proposta.bloqueios.length;
    if (abertos > 0) {
      throw new Error("Não é possível finalizar com bloqueios abertos");
    }
  }

  // Saindo de CONFORMIDADE para etapa adiante: checklist 100%
  const saidaConformidade =
    de === "CONFORMIDADE" &&
    (para === "DECISAO" ||
      para === "FORMALIZACAO" ||
      para === "EM_CARTORIO" ||
      para === "FINALIZADO");
  if (saidaConformidade && !(await checklistCompleto(proposta.id))) {
    throw new Error("Checklist documental incompleto para sair de Conformidade");
  }

  const bloqueiosAbertos = proposta.bloqueios.length;
  if (bloqueiosAbertos > 0 && !isFaseTerminal(para)) {
    if (!podeForcarComBloqueio(role) || !parsed.forcarComBloqueio) {
      if (podeForcarComBloqueio(role)) {
        throw new Error(
          "Há bloqueios abertos. Confirme o avanço forçado com observação.",
        );
      }
      throw new Error("Há bloqueios abertos. Resolva-os ou peça a um coordenador.");
    }
    if (!parsed.observacao?.trim()) {
      throw new Error("Observação obrigatória ao avançar com bloqueio aberto");
    }
  }

  const prazoSlaAte = await calcularPrazoSla(para);
  const obsParts = [
    parsed.observacao?.trim(),
    parsed.motivo?.trim()
      ? `Motivo: ${parsed.motivo.trim()}`
      : undefined,
    bloqueiosAbertos > 0 && parsed.forcarComBloqueio
      ? `Avanço forçado com ${bloqueiosAbertos} bloqueio(s) aberto(s)`
      : undefined,
  ].filter(Boolean);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.proposta.update({
      where: { id: proposta.id },
      data: {
        faseAtual: para,
        prazoSlaAte,
        motivoCancelamento:
          para === "CANCELADO" ? parsed.motivo!.trim() : undefined,
        motivoReprovacao:
          para === "REPROVADA" ? parsed.motivo!.trim() : undefined,
      },
    });

    await tx.historicoProposta.create({
      data: {
        propostaId: proposta.id,
        deFase: de,
        paraFase: para,
        observacao: obsParts.join(" · ") || null,
        usuarioId,
      },
    });

    return updated;
  });
}

export async function atribuirAnalista(
  propostaId: string,
  analistaId: string | null,
  usuarioId: string,
  role: Role,
) {
  if (!podeForcarComBloqueio(role) && role !== "ANALISTA") {
    throw new Error("Sem permissão para atribuir");
  }
  // Só admin/coordenador reatribui; analista pode auto-atribuir se vazio
  const proposta = await prisma.proposta.findUnique({
    where: { id: propostaId },
    select: { analistaId: true, faseAtual: true },
  });
  if (!proposta) throw new Error("Proposta não encontrada");

  if (role === "ANALISTA") {
    if (proposta.analistaId && proposta.analistaId !== usuarioId) {
      throw new Error("Proposta já atribuída a outro analista");
    }
    analistaId = usuarioId;
  }

  if (analistaId) {
    const user = await prisma.usuario.findUnique({
      where: { id: analistaId },
      select: { ativo: true, role: true },
    });
    if (!user?.ativo) throw new Error("Analista inválido");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.proposta.update({
      where: { id: propostaId },
      data: {
        analistaId,
        ...(proposta.faseAtual === "ENTRADA" && analistaId
          ? {
              faseAtual: "ANALISE" as FaseProcesso,
              prazoSlaAte: await calcularPrazoSla("ANALISE"),
            }
          : {}),
      },
    });

    if (proposta.faseAtual === "ENTRADA" && analistaId) {
      await tx.historicoProposta.create({
        data: {
          propostaId,
          deFase: "ENTRADA",
          paraFase: "ANALISE",
          observacao: "Atribuída a analista",
          usuarioId,
        },
      });
    } else {
      await tx.historicoProposta.create({
        data: {
          propostaId,
          deFase: proposta.faseAtual,
          paraFase: proposta.faseAtual,
          observacao: analistaId
            ? "Analista atribuído/reatribuído"
            : "Analista removido",
          usuarioId,
        },
      });
    }

    return updated;
  });
}

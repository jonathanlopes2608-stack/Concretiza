import type { ChecklistStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import {
  consolidarStatus,
  cpfCadastroParaTemplate,
  executarConformidade,
  mensagemConsolidada,
  tipoRegraParaCodigoTemplate,
} from "@/src/lib/conformidade-engine";
import {
  absoluteFromRelative,
  removerArquivoRelativo,
  salvarUpload,
} from "@/src/lib/files";

const ROLES_DESBLOQUEIO: Role[] = ["ADMIN", "COORDENADOR"];

export function podeAlterarItemBloqueado(role: Role) {
  return ROLES_DESBLOQUEIO.includes(role);
}

async function assertItemEditavel(respostaId: string, role: Role, acao: string) {
  const item = await prisma.checklistResposta.findUnique({
    where: { id: respostaId },
    select: { status: true },
  });
  if (!item) throw new Error("Item de checklist não encontrado");
  if (item.status === "OK" && !podeAlterarItemBloqueado(role)) {
    throw new Error(
      `Item validado (OK) está bloqueado. Não é possível ${acao}. Peça a um coordenador/admin para reabrir.`,
    );
  }
  return item;
}

export async function atualizarStatusChecklist(
  respostaId: string,
  status: ChecklistStatus,
  observacao: string | null | undefined,
  role: Role,
  usuarioId?: string,
) {
  const atual = await prisma.checklistResposta.findUnique({
    where: { id: respostaId },
    select: {
      status: true,
      propostaId: true,
      template: { select: { label: true } },
    },
  });
  if (!atual) throw new Error("Item de checklist não encontrado");

  // Item OK só pode ser reaberto por coordenador/admin
  if (atual.status === "OK" && status !== "OK" && !podeAlterarItemBloqueado(role)) {
    throw new Error(
      "Item validado (OK) está bloqueado. Peça a um coordenador/admin para reabrir.",
    );
  }

  const reabrindo = atual.status === "OK" && status === "PENDENTE";

  const data: Prisma.ChecklistRespostaUpdateInput = { status };

  if (status === "OK") {
    data.observacao = observacao?.trim()
      ? observacao.trim()
      : "Documento validado";
  } else if (reabrindo) {
    data.observacao = "Reaberto para nova análise";
  } else if (status === "PENDENTE") {
    data.observacao = observacao?.trim() ? observacao.trim() : null;
  } else if (observacao !== undefined) {
    data.observacao = observacao?.trim() ? observacao.trim() : null;
  }

  const updated = await prisma.checklistResposta.update({
    where: { id: respostaId },
    data,
  });

  if (usuarioId) {
    const {
      abrirBloqueioPorChecklist,
      resolverBloqueiosChecklistItem,
    } = await import("@/src/modules/bloqueios/service");
    if (status === "REPROVADO") {
      await abrirBloqueioPorChecklist(
        atual.propostaId,
        respostaId,
        observacao?.trim() || `Pendente: ${atual.template.label}`,
        usuarioId,
      );
    }
    if (status === "OK") {
      await resolverBloqueiosChecklistItem(respostaId, usuarioId);
    }
  }

  // Invalida validações automáticas para o sync da página não recolocar OK
  if (reabrindo) {
    await prisma.validacaoDocumento.updateMany({
      where: { documento: { checklistRespostaId: respostaId } },
      data: {        status: "PENDENTE",
        detalhes: {
          engine: "reabertura",
          message: "Validação invalidada ao reabrir o item",
        },
      },
    });
  }

  return updated;
}

export async function salvarValidadeChecklist(
  respostaId: string,
  validadeInformada: Date | null,
  role: Role,
) {
  await assertItemEditavel(respostaId, role, "alterar a validade");
  return prisma.checklistResposta.update({
    where: { id: respostaId },
    data: { validadeInformada },
  });
}

export async function anexarDocumento(
  params: {
    checklistRespostaId: string;
    nomeOriginal: string;
    mimeType: string;
    buffer: Buffer;
    validadeInformada?: Date | null;
  },
  role: Role,
) {
  await assertItemEditavel(params.checklistRespostaId, role, "anexar documento");

  const resposta = await prisma.checklistResposta.findUnique({
    where: { id: params.checklistRespostaId },
    include: {
      template: true,
      proposta: {
        select: { id: true, compradorCpf: true, vendedorCpfCnpj: true },
      },
    },
  });
  if (!resposta) throw new Error("Item de checklist não encontrado");

  const validadeInformada =
    params.validadeInformada ?? resposta.validadeInformada ?? null;

  const saved = await salvarUpload({
    propostaId: resposta.proposta.id,
    checklistRespostaId: resposta.id,
    nomeOriginal: params.nomeOriginal,
    mimeType: params.mimeType,
    buffer: params.buffer,
  });

  const documento = await prisma.documento.create({
    data: {
      checklistRespostaId: resposta.id,
      nomeOriginal: params.nomeOriginal,
      mimeType: saved.mimeType,
      path: saved.path,
      hash: saved.hash,
      tamanhoBytes: saved.tamanhoBytes,
    },
  });

  const tipoRegra = tipoRegraParaCodigoTemplate(resposta.template.codigo);
  const cpfCadastro = cpfCadastroParaTemplate(resposta.template.codigo, {
    compradorCpf: resposta.proposta.compradorCpf,
    vendedorCpfCnpj: resposta.proposta.vendedorCpfCnpj,
  });

  const resultados = await executarConformidade({
    documentoId: documento.id,
    mimeType: saved.mimeType,
    path: saved.path,
    tipoRegra,
    validadeInformada,
    cpfCadastro,
  });

  const validacoes = [];
  for (const resultado of resultados) {
    const validacao = await prisma.validacaoDocumento.create({
      data: {
        documentoId: documento.id,
        status: resultado.status,
        tipoRegra: resultado.tipoRegra,
        validadeDetectada: resultado.validadeDetectada ?? null,
        detalhes: (resultado.detalhes ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    validacoes.push(validacao);
  }

  const validadeFinal =
    resultados.find((r) => r.validadeDetectada)?.validadeDetectada ??
    validadeInformada ??
    null;

  const consolidado = consolidarStatus(resultados);
  const obsAuto = mensagemConsolidada(resultados);

  // Sincroniza status do item com o resultado da validação automática
  if (tipoRegra === "VALIDADE_IDENTIDADE") {
    if (consolidado === "APROVADO") {
      await prisma.checklistResposta.update({
        where: { id: resposta.id },
        data: {
          status: "OK",
          observacao: obsAuto || "Documento válido (validação automática)",
          validadeInformada: validadeFinal,
        },
      });
    } else if (consolidado === "REPROVADO") {
      await prisma.checklistResposta.update({
        where: { id: resposta.id },
        data: {
          status: "REPROVADO",
          observacao: obsAuto || "Documento reprovado (validação automática)",
          validadeInformada: validadeFinal,
        },
      });
    } else if (validadeFinal) {
      await prisma.checklistResposta.update({
        where: { id: resposta.id },
        data: {
          validadeInformada: validadeFinal,
          observacao: obsAuto || (
            resposta.observacao?.includes("vencido") ||
            resposta.observacao?.includes("diverge")
              ? null
              : resposta.observacao
          ),
        },
      });
    } else if (obsAuto) {
      await prisma.checklistResposta.update({
        where: { id: resposta.id },
        data: { observacao: obsAuto },
      });
    }
  } else if (validadeFinal) {
    await prisma.checklistResposta.update({
      where: { id: resposta.id },
      data: { validadeInformada: validadeFinal },
    });
  }

  return { documento, validacoes, resultados };
}

export async function removerDocumento(documentoId: string, role: Role) {
  const doc = await prisma.documento.findUnique({
    where: { id: documentoId },
    include: { checklistResposta: { select: { id: true, status: true } } },
  });
  if (!doc) throw new Error("Documento não encontrado");

  if (doc.checklistResposta.status === "OK" && !podeAlterarItemBloqueado(role)) {
    throw new Error(
      "Item validado (OK) está bloqueado. Não é possível remover o anexo.",
    );
  }

  await prisma.documento.delete({ where: { id: documentoId } });
  await removerArquivoRelativo(doc.path);
  return doc;
}

export async function obterDocumentoParaDownload(documentoId: string) {
  const doc = await prisma.documento.findUnique({
    where: { id: documentoId },
    include: {
      checklistResposta: { select: { propostaId: true } },
    },
  });
  if (!doc) return null;
  return {
    ...doc,
    absolutePath: absoluteFromRelative(doc.path),
  };
}

export async function listarChecklistProposta(propostaId: string) {
  return prisma.checklistResposta.findMany({
    where: { propostaId },
    include: {
      template: true,
      documentos: {
        orderBy: { createdAt: "desc" },
        include: {
          validacoes: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      },
    },
    orderBy: [{ template: { grupo: "asc" } }, { template: { ordem: "asc" } }],
  });
}

/**
 * Alinha inconsistências leves ao abrir a proposta.
 * Não altera item PENDENTE (respeita Reabrir / análise manual).
 * Upload já sincroniza status; aqui só corrige legado e vencimento em OK.
 */
export async function sincronizarChecklistComValidacoes(propostaId: string) {
  const itens = await prisma.checklistResposta.findMany({
    where: { propostaId },
    include: {
      documentos: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          validacoes: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      },
    },
  });

  for (const item of itens) {
    // Item aberto para análise — não forçar OK/REPROVADO de volta
    if (item.status === "PENDENTE") continue;

    const vals = item.documentos[0]?.validacoes ?? [];
    if (vals.length === 0) continue;

    const resultados = vals.map((v) => ({
      status: v.status,
      tipoRegra: v.tipoRegra,
      validadeDetectada: v.validadeDetectada,
      detalhes: (v.detalhes as Record<string, unknown> | null) ?? undefined,
    }));
    const consolidado = consolidarStatus(resultados);
    const obsAuto = mensagemConsolidada(resultados);
    const validadeDetectada =
      vals.find((v) => v.validadeDetectada)?.validadeDetectada ??
      item.validadeInformada;

    // Legado: validação APROVADA mas item ficou REPROVADO por mensagem antiga
    if (consolidado === "APROVADO" && item.status === "REPROVADO") {
      await prisma.checklistResposta.update({
        where: { id: item.id },
        data: {
          status: "OK",
          observacao: obsAuto || "Documento válido (validação automática)",
          validadeInformada: validadeDetectada,
        },
      });
      continue;
    }

    // Documento vencido/divergente com item ainda OK
    if (consolidado === "REPROVADO" && item.status === "OK") {
      await prisma.checklistResposta.update({
        where: { id: item.id },
        data: {
          status: "REPROVADO",
          observacao: obsAuto || "Documento reprovado (validação automática)",
          validadeInformada: validadeDetectada,
        },
      });
      continue;
    }

    if (
      item.status === "OK" &&
      consolidado === "APROVADO" &&
      (item.observacao?.toLowerCase().includes("vencido") ||
        item.observacao?.toLowerCase().includes("diverge"))
    ) {
      await prisma.checklistResposta.update({
        where: { id: item.id },
        data: {
          observacao: obsAuto || "Documento válido (validação automática)",
        },
      });
    }
  }
}

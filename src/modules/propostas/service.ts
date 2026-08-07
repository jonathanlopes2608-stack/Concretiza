import type { OrigemProposta, Prisma, FaseProcesso } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { nomeCompleto } from "@/src/lib/grupos";
import { calcularPrazoSla } from "@/src/lib/sla";
import {
  propostaCreateSchema,
  type PropostaCreateInput,
  type PropostaUpdateInput,
} from "@/src/modules/propostas/schema";

export type { FilaFiltros, PropostaFila } from "@/src/modules/propostas/repository";
export { listarFila } from "@/src/modules/propostas/repository";

function emptyToNull(value?: string | null) {
  if (value === undefined || value === null || value.trim() === "") return null;
  return value.trim();
}

function mapUsuarioNome<T extends { nome: string; sobrenome?: string | null }>(u: T) {
  return { ...u, nome: nomeCompleto(u.nome, u.sobrenome) };
}

export async function buscarPropostaPorId(id: string) {
  const proposta = await prisma.proposta.findUnique({
    where: { id },
    include: {
      analista: { select: { id: true, nome: true, sobrenome: true, email: true } },
      historicos: {
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { usuario: { select: { id: true, nome: true, sobrenome: true } } },
      },
      bloqueios: {
        orderBy: [{ status: "asc" }, { abertoEm: "desc" }],
        include: {
          tipoDependencia: true,
          abertoPor: { select: { id: true, nome: true, sobrenome: true } },
          resolvidoPor: { select: { id: true, nome: true, sobrenome: true } },
        },
      },
      checklistRespostas: {
        include: {
          template: true,
          documentos: {
            orderBy: { createdAt: "desc" },
            include: {
              validacoes: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
        orderBy: [{ template: { grupo: "asc" } }, { template: { ordem: "asc" } }],
      },
    },
  });
  if (!proposta) return null;
  return {
    ...proposta,
    analista: proposta.analista ? mapUsuarioNome(proposta.analista) : null,
    historicos: proposta.historicos.map((h) => ({
      ...h,
      usuario: h.usuario ? mapUsuarioNome(h.usuario) : null,
    })),
    bloqueios: proposta.bloqueios.map((b) => ({
      ...b,
      abertoPor: b.abertoPor ? mapUsuarioNome(b.abertoPor) : null,
      resolvidoPor: b.resolvidoPor ? mapUsuarioNome(b.resolvidoPor) : null,
    })),
  };
}

export async function existeNumeroProposta(numero: string, exceptId?: string) {
  const found = await prisma.proposta.findUnique({
    where: { numeroPropostaCaixa: numero },
    select: { id: true },
  });
  if (!found) return false;
  return exceptId ? found.id !== exceptId : true;
}

export async function existeNumeroProcesso(numero: string, exceptId?: string) {
  const found = await prisma.proposta.findUnique({
    where: { numeroProcessoInterno: numero },
    select: { id: true },
  });
  if (!found) return false;
  return exceptId ? found.id !== exceptId : true;
}

export async function criarPropostaRecord(
  data: PropostaCreateInput,
  origem: OrigemProposta,
  prazoSlaAte: Date | null,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx) => {
    const proposta = await tx.proposta.create({
      data: {
        numeroPropostaCaixa: emptyToNull(data.numeroPropostaCaixa ?? null),
        numeroProcessoInterno: emptyToNull(data.numeroProcessoInterno ?? null),
        despachanteNome: emptyToNull(data.despachanteNome ?? null),
        modalidade: data.modalidade,
        prioridade: data.prioridade,
        origem,
        faseAtual: "ENTRADA",
        prazoSlaAte,
        compradorNome: data.compradorNome.trim(),
        compradorCpf: data.compradorCpf,
        compradorTelefone: emptyToNull(data.compradorTelefone ?? null),
        compradorEmail: emptyToNull(data.compradorEmail ?? null),
        ...(data.cadastroCliente
          ? { cadastroCliente: data.cadastroCliente as Prisma.InputJsonValue }
          : {}),
        vendedorNome: emptyToNull(data.vendedorNome ?? null),
        vendedorCpfCnpj: emptyToNull(data.vendedorCpfCnpj ?? null),
        imovelEndereco: emptyToNull(data.imovelEndereco ?? null),
        imovelCidade: emptyToNull(data.imovelCidade ?? null),
        imovelUf: emptyToNull(data.imovelUf ?? null),
        valorImovel: data.valorImovel ?? null,
        valorFinanciamento: data.valorFinanciamento ?? null,
        imobiliaria: emptyToNull(data.imobiliaria ?? null),
      },
    });

    const templates = await tx.checklistTemplateItem.findMany({
      where: { ativo: true },
      select: { id: true },
    });

    if (templates.length > 0) {
      await tx.checklistResposta.createMany({
        data: templates.map((t) => ({
          propostaId: proposta.id,
          templateId: t.id,
          status: "PENDENTE",
        })),
      });
    }

    await tx.historicoProposta.create({
      data: {
        propostaId: proposta.id,
        deFase: null,
        paraFase: "ENTRADA" satisfies FaseProcesso,
        observacao: `Proposta criada via ${origem}`,
        usuarioId,
      },
    });

    return proposta;
  });
}

export async function criarPropostaCompleta(
  data: unknown,
  origem: OrigemProposta,
  usuarioId: string,
) {
  const parsed = propostaCreateSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }
  if (
    parsed.data.numeroPropostaCaixa &&
    (await existeNumeroProposta(parsed.data.numeroPropostaCaixa))
  ) {
    throw new Error(`Número Caixa ${parsed.data.numeroPropostaCaixa} já cadastrado`);
  }
  if (
    parsed.data.numeroProcessoInterno &&
    (await existeNumeroProcesso(parsed.data.numeroProcessoInterno))
  ) {
    throw new Error(`Processo ${parsed.data.numeroProcessoInterno} já cadastrado`);
  }
  const prazoSlaAte = await calcularPrazoSla("ENTRADA");
  return criarPropostaRecord(parsed.data, origem, prazoSlaAte, usuarioId);
}

export async function atualizarPropostaRecord(id: string, data: PropostaUpdateInput) {
  const patch: Prisma.PropostaUpdateInput = {};

  if (data.numeroPropostaCaixa !== undefined) {
    patch.numeroPropostaCaixa = emptyToNull(data.numeroPropostaCaixa ?? null);
  }
  if (data.numeroProcessoInterno !== undefined) {
    patch.numeroProcessoInterno = emptyToNull(data.numeroProcessoInterno ?? null);
  }
  if (data.despachanteNome !== undefined) {
    patch.despachanteNome = emptyToNull(data.despachanteNome ?? null);
  }
  if (data.modalidade !== undefined) patch.modalidade = data.modalidade;
  if (data.prioridade !== undefined) patch.prioridade = data.prioridade;
  if (data.compradorNome !== undefined) patch.compradorNome = data.compradorNome.trim();
  if (data.compradorCpf !== undefined) patch.compradorCpf = data.compradorCpf;
  if (data.compradorTelefone !== undefined) {
    patch.compradorTelefone = emptyToNull(data.compradorTelefone ?? null);
  }
  if (data.compradorEmail !== undefined) {
    patch.compradorEmail = emptyToNull(data.compradorEmail ?? null);
  }
  if (data.vendedorNome !== undefined) patch.vendedorNome = emptyToNull(data.vendedorNome ?? null);
  if (data.vendedorCpfCnpj !== undefined) {
    patch.vendedorCpfCnpj = emptyToNull(data.vendedorCpfCnpj ?? null);
  }
  if (data.imovelEndereco !== undefined) {
    patch.imovelEndereco = emptyToNull(data.imovelEndereco ?? null);
  }
  if (data.imovelCidade !== undefined) patch.imovelCidade = emptyToNull(data.imovelCidade ?? null);
  if (data.imovelUf !== undefined) patch.imovelUf = emptyToNull(data.imovelUf ?? null);
  if (data.valorImovel !== undefined) patch.valorImovel = data.valorImovel;
  if (data.valorFinanciamento !== undefined) {
    patch.valorFinanciamento = data.valorFinanciamento;
  }
  if (data.imobiliaria !== undefined) patch.imobiliaria = emptyToNull(data.imobiliaria ?? null);
  if (data.cadastroCliente !== undefined) {
    patch.cadastroCliente = data.cadastroCliente as Prisma.InputJsonValue;
  }

  return prisma.proposta.update({ where: { id }, data: patch });
}

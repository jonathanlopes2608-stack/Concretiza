import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const n = await p.proposta.count();
  console.log("propostas:", n);
  if (n > 0) {
    const f = await p.proposta.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, numeroProcessoInterno: true, faseAtual: true, bloqueioResumo: true },
    });
    console.log("existing", f);
    return;
  }

  const admin = await p.usuario.findFirst({ where: { email: "admin@concretiza.local" } });
  const prop = await p.proposta.create({
    data: {
      numeroProcessoInterno: "AC/QA DEMO 001",
      numeroPropostaCaixa: "2026.DEMO-001",
      despachanteNome: "Bruno",
      compradorNome: "Maria Silva Demo",
      compradorCpf: "12345678901",
      faseAtual: "ANALISE",
      modalidade: "SBPE",
      prioridade: "NORMAL",
      origem: "MANUAL",
      analistaId: admin?.id,
      valorFinanciamento: 250000,
      imovelCidade: "São Paulo",
      imovelUf: "SP",
    },
  });

  const templates = await p.checklistTemplateItem.findMany({
    where: { ativo: true },
    select: { id: true },
  });
  if (templates.length) {
    await p.checklistResposta.createMany({
      data: templates.map((t) => ({
        propostaId: prop.id,
        templateId: t.id,
        status: "PENDENTE",
      })),
    });
  }

  await p.historicoProposta.create({
    data: {
      propostaId: prop.id,
      deFase: null,
      paraFase: "ANALISE",
      observacao: "Demo manual operacional",
      usuarioId: admin?.id,
    },
  });

  const tipo = await p.tipoDependencia.findFirst({ where: { codigo: "CLIENTE" } });
  if (tipo && admin) {
    await p.bloqueioProcesso.create({
      data: {
        propostaId: prop.id,
        tipoDependenciaId: tipo.id,
        titulo: "Enviar CNH atualizada",
        descricao: "Documento de exemplo para o manual",
        origem: "MANUAL",
        abertoPorId: admin.id,
        status: "ABERTO",
      },
    });
    await p.proposta.update({
      where: { id: prop.id },
      data: { bloqueioResumo: "Cliente / comprador: Enviar CNH atualizada" },
    });
  }

  console.log("created", prop.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());

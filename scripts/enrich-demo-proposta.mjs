import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const prop = await p.proposta.findFirst({ orderBy: { createdAt: "desc" } });
  if (!prop) throw new Error("sem proposta");

  const admin = await p.usuario.findFirst({ where: { email: "admin@concretiza.local" } });
  const tipo = await p.tipoDependencia.findFirst({ where: { codigo: "CLIENTE" } });

  await p.proposta.update({
    where: { id: prop.id },
    data: {
      numeroProcessoInterno: prop.numeroProcessoInterno ?? "AC/QA DEMO 001",
      despachanteNome: prop.despachanteNome ?? "Bruno",
      faseAtual: "ANALISE",
      analistaId: admin?.id ?? prop.analistaId,
      bloqueioResumo: "Cliente / comprador: Enviar CNH atualizada",
    },
  });

  const abertos = await p.bloqueioProcesso.count({
    where: { propostaId: prop.id, status: "ABERTO" },
  });
  if (abertos === 0 && tipo && admin) {
    await p.bloqueioProcesso.create({
      data: {
        propostaId: prop.id,
        tipoDependenciaId: tipo.id,
        titulo: "Enviar CNH atualizada",
        descricao: "Exemplo para o manual operacional",
        origem: "MANUAL",
        abertoPorId: admin.id,
        status: "ABERTO",
      },
    });
  }

  // garantir checklist
  const resp = await p.checklistResposta.count({ where: { propostaId: prop.id } });
  if (resp === 0) {
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
  }

  console.log("ready", prop.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());

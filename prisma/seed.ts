import { PrismaClient, Role, FaseProcesso, ChecklistGrupo } from "@prisma/client";
import { hash } from "bcryptjs";
import { GRUPOS_SISTEMA_SEED } from "../src/lib/grupos";

const prisma = new PrismaClient();

const checklistSeed = [
  { codigo: "COMP_RG_CNH", grupo: ChecklistGrupo.COMPRADOR, label: "RG ou CNH do comprador", ordem: 1 },
  { codigo: "COMP_CPF", grupo: ChecklistGrupo.COMPRADOR, label: "CPF do comprador", ordem: 2 },
  { codigo: "COMP_COMPROVANTE_RENDA", grupo: ChecklistGrupo.COMPRADOR, label: "Comprovante de renda", ordem: 3 },
  { codigo: "COMP_COMPROVANTE_RESIDENCIA", grupo: ChecklistGrupo.COMPRADOR, label: "Comprovante de residência", ordem: 4 },
  { codigo: "COMP_CERTIDAO_ESTADO_CIVIL", grupo: ChecklistGrupo.COMPRADOR, label: "Certidão de estado civil", ordem: 5 },
  { codigo: "VEND_RG_CNH", grupo: ChecklistGrupo.VENDEDOR, label: "RG ou CNH do vendedor", ordem: 1 },
  { codigo: "VEND_CPF_CNPJ", grupo: ChecklistGrupo.VENDEDOR, label: "CPF/CNPJ do vendedor", ordem: 2 },
  { codigo: "VEND_CERTIDAO_ESTADO_CIVIL", grupo: ChecklistGrupo.VENDEDOR, label: "Certidão de estado civil do vendedor", ordem: 3 },
  { codigo: "IMO_MATRICULA", grupo: ChecklistGrupo.IMOVEL, label: "Matrícula atualizada do imóvel", ordem: 1 },
  { codigo: "IMO_IPTU", grupo: ChecklistGrupo.IMOVEL, label: "IPTU / certidão de tributos", ordem: 2 },
  { codigo: "IMO_HABITE_SE", grupo: ChecklistGrupo.IMOVEL, label: "Habite-se (quando aplicável)", ordem: 3 },
  { codigo: "IMO_CONTRATO", grupo: ChecklistGrupo.IMOVEL, label: "Contrato / compromisso de compra e venda", ordem: 4 },
];

const slaSeed: { faseEtapa: FaseProcesso; horasPrazo: number }[] = [
  { faseEtapa: FaseProcesso.ENTRADA, horasPrazo: 4 },
  { faseEtapa: FaseProcesso.ANALISE, horasPrazo: 24 },
  { faseEtapa: FaseProcesso.RESTRICAO, horasPrazo: 72 },
  { faseEtapa: FaseProcesso.ENGENHARIA, horasPrazo: 120 },
  { faseEtapa: FaseProcesso.DEBITO_FGTS, horasPrazo: 72 },
  { faseEtapa: FaseProcesso.CONFORMIDADE, horasPrazo: 48 },
  { faseEtapa: FaseProcesso.DECISAO, horasPrazo: 48 },
  { faseEtapa: FaseProcesso.EM_CARTORIO, horasPrazo: 120 },
  { faseEtapa: FaseProcesso.FORMALIZACAO, horasPrazo: 48 },
  { faseEtapa: FaseProcesso.FINALIZADO, horasPrazo: 0 },
  { faseEtapa: FaseProcesso.CANCELADO, horasPrazo: 0 },
  { faseEtapa: FaseProcesso.REPROVADA, horasPrazo: 0 },
];

const dependenciaSeed = [
  { codigo: "CLIENTE", label: "Cliente / comprador", sistema: true },
  { codigo: "DESPACHANTE", label: "Despachante", sistema: true },
  { codigo: "ANALISTA", label: "Analista interno (EN QA)", sistema: true },
  { codigo: "ENGENHARIA", label: "Engenharia (Caixa / OS)", sistema: true },
  { codigo: "BANCO_AGENCIA", label: "Banco / Agência", sistema: true },
  { codigo: "CARTORIO", label: "Cartório", sistema: true },
];

async function main() {
  for (const item of checklistSeed) {
    await prisma.checklistTemplateItem.upsert({
      where: { codigo: item.codigo },
      update: { label: item.label, grupo: item.grupo, ordem: item.ordem, ativo: true },
      create: item,
    });
  }

  for (const sla of slaSeed) {
    await prisma.slaConfig.upsert({
      where: { faseEtapa: sla.faseEtapa },
      update: { horasPrazo: sla.horasPrazo, ativo: true },
      create: sla,
    });
  }

  for (const dep of dependenciaSeed) {
    await prisma.tipoDependencia.upsert({
      where: { codigo: dep.codigo },
      update: { label: dep.label, sistema: dep.sistema, ativo: true },
      create: dep,
    });
  }

  for (const g of GRUPOS_SISTEMA_SEED) {
    await prisma.grupoUsuario.upsert({
      where: { codigo: g.codigo },
      update: {
        nome: g.nome,
        descricao: g.descricao,
        role: g.role,
        permissoes: g.permissoes,
        sistema: true,
        ativo: true,
      },
      create: {
        codigo: g.codigo,
        nome: g.nome,
        descricao: g.descricao,
        role: g.role,
        permissoes: g.permissoes,
        sistema: true,
        ativo: true,
      },
    });
  }

  const grupoAdmin = await prisma.grupoUsuario.findUniqueOrThrow({
    where: { codigo: "ADMIN" },
  });

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@concretiza.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@123";
  const senhaHash = await hash(adminPassword, 12);

  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      senhaHash,
      nome: "Administrador",
      sobrenome: "Sistema",
      role: Role.ADMIN,
      grupoId: grupoAdmin.id,
      ativo: true,
    },
    create: {
      email: adminEmail,
      nome: "Administrador",
      sobrenome: "Sistema",
      senhaHash,
      role: Role.ADMIN,
      grupoId: grupoAdmin.id,
      ativo: true,
      twoFactorEnabled: false,
    },
  });

  // Vincula usuários legados sem grupo ao grupo do respectivo role
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
    await prisma.usuario.update({ where: { id: u.id }, data: { grupoId } });
  }

  console.log(`Seed concluído. Admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

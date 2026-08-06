-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COORDENADOR', 'ANALISTA', 'VISUALIZACAO');

-- CreateEnum
CREATE TYPE "StatusProposta" AS ENUM ('ENTRADA', 'EM_ANALISE', 'PENDENCIA', 'CONFORME', 'ENVIADA_CAIXA', 'REPROVADA');

-- CreateEnum
CREATE TYPE "OrigemProposta" AS ENUM ('MANUAL', 'EXCEL', 'API');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "Modalidade" AS ENUM ('SBPE', 'FGTS', 'PRO_COTISTA', 'OUTRO');

-- CreateEnum
CREATE TYPE "ChecklistGrupo" AS ENUM ('COMPRADOR', 'VENDEDOR', 'IMOVEL');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('PENDENTE', 'OK', 'REPROVADO');

-- CreateEnum
CREATE TYPE "ValidacaoStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO', 'ERRO');

-- CreateEnum
CREATE TYPE "CompromissoTipo" AS ENUM ('ASSINATURA', 'RETORNO_PENDENCIA', 'PRAZO', 'OUTRO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ANALISTA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposta" (
    "id" TEXT NOT NULL,
    "numeroPropostaCaixa" TEXT NOT NULL,
    "modalidade" "Modalidade" NOT NULL DEFAULT 'SBPE',
    "status" "StatusProposta" NOT NULL DEFAULT 'ENTRADA',
    "origem" "OrigemProposta" NOT NULL DEFAULT 'MANUAL',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'NORMAL',
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prazoSlaAte" TIMESTAMP(3),
    "motivoReprovacao" TEXT,
    "compradorNome" TEXT NOT NULL,
    "compradorCpf" TEXT NOT NULL,
    "compradorTelefone" TEXT,
    "compradorEmail" TEXT,
    "vendedorNome" TEXT,
    "vendedorCpfCnpj" TEXT,
    "imovelEndereco" TEXT,
    "imovelCidade" TEXT,
    "imovelUf" CHAR(2),
    "valorImovel" DECIMAL(14,2),
    "valorFinanciamento" DECIMAL(14,2),
    "imobiliaria" TEXT,
    "analistaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoProposta" (
    "id" TEXT NOT NULL,
    "propostaId" TEXT NOT NULL,
    "deStatus" "StatusProposta",
    "paraStatus" "StatusProposta" NOT NULL,
    "observacao" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoProposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplateItem" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "grupo" "ChecklistGrupo" NOT NULL,
    "label" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistResposta" (
    "id" TEXT NOT NULL,
    "propostaId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistResposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "checklistRespostaId" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "hash" TEXT,
    "tamanhoBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidacaoDocumento" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "status" "ValidacaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "tipoRegra" TEXT NOT NULL,
    "validadeDetectada" TIMESTAMP(3),
    "detalhes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidacaoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaConfig" (
    "id" TEXT NOT NULL,
    "statusEtapa" "StatusProposta" NOT NULL,
    "horasPrazo" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compromisso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "CompromissoTipo" NOT NULL DEFAULT 'OUTRO',
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "observacao" TEXT,
    "usuarioId" TEXT NOT NULL,
    "propostaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compromisso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proposta_numeroPropostaCaixa_key" ON "Proposta"("numeroPropostaCaixa");

-- CreateIndex
CREATE INDEX "Proposta_status_idx" ON "Proposta"("status");

-- CreateIndex
CREATE INDEX "Proposta_analistaId_idx" ON "Proposta"("analistaId");

-- CreateIndex
CREATE INDEX "Proposta_prazoSlaAte_idx" ON "Proposta"("prazoSlaAte");

-- CreateIndex
CREATE INDEX "HistoricoProposta_propostaId_idx" ON "HistoricoProposta"("propostaId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistTemplateItem_codigo_key" ON "ChecklistTemplateItem"("codigo");

-- CreateIndex
CREATE INDEX "ChecklistResposta_propostaId_idx" ON "ChecklistResposta"("propostaId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistResposta_propostaId_templateId_key" ON "ChecklistResposta"("propostaId", "templateId");

-- CreateIndex
CREATE INDEX "Documento_checklistRespostaId_idx" ON "Documento"("checklistRespostaId");

-- CreateIndex
CREATE INDEX "ValidacaoDocumento_documentoId_idx" ON "ValidacaoDocumento"("documentoId");

-- CreateIndex
CREATE UNIQUE INDEX "SlaConfig_statusEtapa_key" ON "SlaConfig"("statusEtapa");

-- CreateIndex
CREATE INDEX "Compromisso_usuarioId_inicio_idx" ON "Compromisso"("usuarioId", "inicio");

-- CreateIndex
CREATE INDEX "Compromisso_propostaId_idx" ON "Compromisso"("propostaId");

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoProposta" ADD CONSTRAINT "HistoricoProposta_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "Proposta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoProposta" ADD CONSTRAINT "HistoricoProposta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResposta" ADD CONSTRAINT "ChecklistResposta_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "Proposta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResposta" ADD CONSTRAINT "ChecklistResposta_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplateItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_checklistRespostaId_fkey" FOREIGN KEY ("checklistRespostaId") REFERENCES "ChecklistResposta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidacaoDocumento" ADD CONSTRAINT "ValidacaoDocumento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compromisso" ADD CONSTRAINT "Compromisso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compromisso" ADD CONSTRAINT "Compromisso_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "Proposta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

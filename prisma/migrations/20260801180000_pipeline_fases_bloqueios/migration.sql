-- AlterEnum: create FaseProcesso and migrate from StatusProposta

CREATE TYPE "FaseProcesso" AS ENUM (
  'ENTRADA',
  'ANALISE',
  'RESTRICAO',
  'ENGENHARIA',
  'DEBITO_FGTS',
  'CONFORMIDADE',
  'DECISAO',
  'EM_CARTORIO',
  'FORMALIZACAO',
  'FINALIZADO',
  'CANCELADO',
  'REPROVADA'
);

CREATE TYPE "BloqueioStatus" AS ENUM ('ABERTO', 'RESOLVIDO');
CREATE TYPE "BloqueioOrigem" AS ENUM ('MANUAL', 'CHECKLIST', 'SISTEMA');

-- Proposta: new columns
ALTER TABLE "Proposta" ADD COLUMN "numeroProcessoInterno" TEXT;
ALTER TABLE "Proposta" ADD COLUMN "despachanteNome" TEXT;
ALTER TABLE "Proposta" ADD COLUMN "faseAtual" "FaseProcesso";
ALTER TABLE "Proposta" ADD COLUMN "motivoCancelamento" TEXT;
ALTER TABLE "Proposta" ADD COLUMN "bloqueioResumo" TEXT;

-- Map old status -> faseAtual
UPDATE "Proposta" SET "faseAtual" = CASE "status"::text
  WHEN 'ENTRADA' THEN 'ENTRADA'::"FaseProcesso"
  WHEN 'EM_ANALISE' THEN 'ANALISE'::"FaseProcesso"
  WHEN 'PENDENCIA' THEN 'ANALISE'::"FaseProcesso"
  WHEN 'CONFORME' THEN 'CONFORMIDADE'::"FaseProcesso"
  WHEN 'ENVIADA_CAIXA' THEN 'FINALIZADO'::"FaseProcesso"
  WHEN 'REPROVADA' THEN 'REPROVADA'::"FaseProcesso"
  ELSE 'ENTRADA'::"FaseProcesso"
END;

ALTER TABLE "Proposta" ALTER COLUMN "faseAtual" SET NOT NULL;
ALTER TABLE "Proposta" ALTER COLUMN "faseAtual" SET DEFAULT 'ENTRADA'::"FaseProcesso";

-- Make numeroPropostaCaixa nullable
ALTER TABLE "Proposta" ALTER COLUMN "numeroPropostaCaixa" DROP NOT NULL;

CREATE UNIQUE INDEX "Proposta_numeroProcessoInterno_key" ON "Proposta"("numeroProcessoInterno");
CREATE INDEX "Proposta_faseAtual_idx" ON "Proposta"("faseAtual");

-- Drop old status column and index
DROP INDEX IF EXISTS "Proposta_status_idx";
ALTER TABLE "Proposta" DROP COLUMN "status";

-- HistoricoProposta: rename status columns to fase
ALTER TABLE "HistoricoProposta" ADD COLUMN "deFase" "FaseProcesso";
ALTER TABLE "HistoricoProposta" ADD COLUMN "paraFase" "FaseProcesso";

UPDATE "HistoricoProposta" SET "paraFase" = CASE "paraStatus"::text
  WHEN 'ENTRADA' THEN 'ENTRADA'::"FaseProcesso"
  WHEN 'EM_ANALISE' THEN 'ANALISE'::"FaseProcesso"
  WHEN 'PENDENCIA' THEN 'ANALISE'::"FaseProcesso"
  WHEN 'CONFORME' THEN 'CONFORMIDADE'::"FaseProcesso"
  WHEN 'ENVIADA_CAIXA' THEN 'FINALIZADO'::"FaseProcesso"
  WHEN 'REPROVADA' THEN 'REPROVADA'::"FaseProcesso"
  ELSE 'ENTRADA'::"FaseProcesso"
END;

UPDATE "HistoricoProposta" SET "deFase" = CASE "deStatus"::text
  WHEN 'ENTRADA' THEN 'ENTRADA'::"FaseProcesso"
  WHEN 'EM_ANALISE' THEN 'ANALISE'::"FaseProcesso"
  WHEN 'PENDENCIA' THEN 'ANALISE'::"FaseProcesso"
  WHEN 'CONFORME' THEN 'CONFORMIDADE'::"FaseProcesso"
  WHEN 'ENVIADA_CAIXA' THEN 'FINALIZADO'::"FaseProcesso"
  WHEN 'REPROVADA' THEN 'REPROVADA'::"FaseProcesso"
  ELSE NULL
END;

ALTER TABLE "HistoricoProposta" ALTER COLUMN "paraFase" SET NOT NULL;
ALTER TABLE "HistoricoProposta" DROP COLUMN "deStatus";
ALTER TABLE "HistoricoProposta" DROP COLUMN "paraStatus";

-- SlaConfig: migrate statusEtapa -> faseEtapa
ALTER TABLE "SlaConfig" ADD COLUMN "faseEtapa" "FaseProcesso";

UPDATE "SlaConfig" SET "faseEtapa" = CASE "statusEtapa"::text
  WHEN 'ENTRADA' THEN 'ENTRADA'::"FaseProcesso"
  WHEN 'EM_ANALISE' THEN 'ANALISE'::"FaseProcesso"
  WHEN 'PENDENCIA' THEN 'ANALISE'::"FaseProcesso"
  WHEN 'CONFORME' THEN 'CONFORMIDADE'::"FaseProcesso"
  WHEN 'ENVIADA_CAIXA' THEN 'FINALIZADO'::"FaseProcesso"
  WHEN 'REPROVADA' THEN 'REPROVADA'::"FaseProcesso"
  ELSE 'ENTRADA'::"FaseProcesso"
END;

-- Remove duplicates that may map to same fase (PENDENCIA and EM_ANALISE both -> ANALISE)
DELETE FROM "SlaConfig" a
USING "SlaConfig" b
WHERE a.id > b.id AND a."faseEtapa" = b."faseEtapa";

ALTER TABLE "SlaConfig" DROP CONSTRAINT IF EXISTS "SlaConfig_statusEtapa_key";
ALTER TABLE "SlaConfig" DROP COLUMN "statusEtapa";
ALTER TABLE "SlaConfig" ALTER COLUMN "faseEtapa" SET NOT NULL;
CREATE UNIQUE INDEX "SlaConfig_faseEtapa_key" ON "SlaConfig"("faseEtapa");

DROP TYPE "StatusProposta";

-- TipoDependencia + BloqueioProcesso
CREATE TABLE "TipoDependencia" (
  "id" TEXT NOT NULL,
  "codigo" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "sistema" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TipoDependencia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TipoDependencia_codigo_key" ON "TipoDependencia"("codigo");

CREATE TABLE "BloqueioProcesso" (
  "id" TEXT NOT NULL,
  "propostaId" TEXT NOT NULL,
  "tipoDependenciaId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "status" "BloqueioStatus" NOT NULL DEFAULT 'ABERTO',
  "origem" "BloqueioOrigem" NOT NULL DEFAULT 'MANUAL',
  "checklistRespostaId" TEXT,
  "abertoPorId" TEXT,
  "resolvidoPorId" TEXT,
  "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvidoEm" TIMESTAMP(3),
  CONSTRAINT "BloqueioProcesso_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BloqueioProcesso_propostaId_status_idx" ON "BloqueioProcesso"("propostaId", "status");
CREATE INDEX "BloqueioProcesso_tipoDependenciaId_idx" ON "BloqueioProcesso"("tipoDependenciaId");
CREATE INDEX "BloqueioProcesso_status_idx" ON "BloqueioProcesso"("status");

ALTER TABLE "BloqueioProcesso" ADD CONSTRAINT "BloqueioProcesso_propostaId_fkey"
  FOREIGN KEY ("propostaId") REFERENCES "Proposta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BloqueioProcesso" ADD CONSTRAINT "BloqueioProcesso_tipoDependenciaId_fkey"
  FOREIGN KEY ("tipoDependenciaId") REFERENCES "TipoDependencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BloqueioProcesso" ADD CONSTRAINT "BloqueioProcesso_abertoPorId_fkey"
  FOREIGN KEY ("abertoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BloqueioProcesso" ADD CONSTRAINT "BloqueioProcesso_resolvidoPorId_fkey"
  FOREIGN KEY ("resolvidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

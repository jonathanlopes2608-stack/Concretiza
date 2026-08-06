-- CreateEnum
CREATE TYPE "CompromissoOrigem" AS ENUM ('CONCRETIZA', 'GOOGLE');

-- CreateEnum
CREATE TYPE "AgendaCompartilhamentoNivel" AS ENUM ('LEITURA');

-- AlterTable
ALTER TABLE "Compromisso" ADD COLUMN "origem" "CompromissoOrigem" NOT NULL DEFAULT 'CONCRETIZA';
ALTER TABLE "Compromisso" ADD COLUMN "googleEventId" TEXT;
ALTER TABLE "Compromisso" ADD COLUMN "googleCalendarId" TEXT;
ALTER TABLE "Compromisso" ADD COLUMN "sincronizadoEm" TIMESTAMP(3);
ALTER TABLE "Compromisso" ADD COLUMN "syncErro" TEXT;
ALTER TABLE "Compromisso" ADD COLUMN "googleUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Compromisso_usuarioId_googleEventId_key" ON "Compromisso"("usuarioId", "googleEventId");
CREATE INDEX "Compromisso_googleEventId_idx" ON "Compromisso"("googleEventId");

-- CreateTable
CREATE TABLE "GoogleConta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "emailGoogle" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "accessTokenEnc" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "syncToken" TEXT,
    "channelId" TEXT,
    "resourceId" TEXT,
    "channelExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleConta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleConta_usuarioId_key" ON "GoogleConta"("usuarioId");

ALTER TABLE "GoogleConta" ADD CONSTRAINT "GoogleConta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AgendaCompartilhamento" (
    "id" TEXT NOT NULL,
    "donoId" TEXT NOT NULL,
    "viewerUsuarioId" TEXT,
    "viewerGrupoId" TEXT,
    "nivel" "AgendaCompartilhamentoNivel" NOT NULL DEFAULT 'LEITURA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgendaCompartilhamento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgendaCompartilhamento_donoId_idx" ON "AgendaCompartilhamento"("donoId");
CREATE INDEX "AgendaCompartilhamento_viewerUsuarioId_idx" ON "AgendaCompartilhamento"("viewerUsuarioId");
CREATE INDEX "AgendaCompartilhamento_viewerGrupoId_idx" ON "AgendaCompartilhamento"("viewerGrupoId");

ALTER TABLE "AgendaCompartilhamento" ADD CONSTRAINT "AgendaCompartilhamento_donoId_fkey" FOREIGN KEY ("donoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgendaCompartilhamento" ADD CONSTRAINT "AgendaCompartilhamento_viewerUsuarioId_fkey" FOREIGN KEY ("viewerUsuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgendaCompartilhamento" ADD CONSTRAINT "AgendaCompartilhamento_viewerGrupoId_fkey" FOREIGN KEY ("viewerGrupoId") REFERENCES "GrupoUsuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

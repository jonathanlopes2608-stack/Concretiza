-- CreateTable
CREATE TABLE "GrupoUsuario" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "role" "Role" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrupoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrupoUsuario_codigo_key" ON "GrupoUsuario"("codigo");

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "grupoId" TEXT;

-- CreateIndex
CREATE INDEX "Usuario_grupoId_idx" ON "Usuario"("grupoId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoUsuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "GrupoUsuario" ADD COLUMN "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[];

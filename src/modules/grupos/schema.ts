import { z } from "zod";
import { PERMISSAO_CODIGOS } from "@/src/lib/permissoes";

const permissaoEnum = z.enum(PERMISSAO_CODIGOS);

export const grupoCreateSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, "Código obrigatório")
    .max(40)
    .transform((v) => v.toUpperCase().replace(/\s+/g, "_")),
  nome: z.string().trim().min(2, "Nome obrigatório").max(80),
  descricao: z.string().trim().max(300).default(""),
  permissoes: z.array(permissaoEnum).default([]),
  ativo: z.boolean().default(true),
});

export const grupoUpdateSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(2, "Nome obrigatório").max(80),
  descricao: z.string().trim().max(300).default(""),
  permissoes: z.array(permissaoEnum).default([]),
  ativo: z.boolean(),
});

export type GrupoCreateInput = z.infer<typeof grupoCreateSchema>;
export type GrupoUpdateInput = z.infer<typeof grupoUpdateSchema>;

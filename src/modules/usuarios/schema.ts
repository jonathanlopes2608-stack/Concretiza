import { z } from "zod";

export const usuarioCreateSchema = z.object({
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .transform((v) => v.toLowerCase()),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(80),
  sobrenome: z.string().trim().min(1, "Sobrenome é obrigatório").max(80),
  grupoId: z.string().min(1, "Grupo de usuário é obrigatório"),
  senha: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(72, "Senha muito longa"),
  ativo: z.boolean().default(true),
});

export const usuarioUpdateSchema = z.object({
  id: z.string().min(1),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .transform((v) => v.toLowerCase()),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(80),
  sobrenome: z.string().trim().min(1, "Sobrenome é obrigatório").max(80),
  grupoId: z.string().min(1, "Grupo de usuário é obrigatório"),
  senha: z
    .string()
    .max(72)
    .optional()
    .transform((v) => (v && v.trim() ? v : undefined))
    .refine((v) => v === undefined || v.length >= 8, {
      message: "Senha deve ter ao menos 8 caracteres",
    }),
  ativo: z.boolean(),
});

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;

import { z } from "zod";

const tipos = ["ASSINATURA", "RETORNO_PENDENCIA", "PRAZO", "OUTRO"] as const;

export const compromissoCreateSchema = z.object({
  titulo: z.string().trim().min(2, "Informe o título").max(200),
  tipo: z.enum(tipos).default("OUTRO"),
  inicio: z.coerce.date(),
  fim: z.coerce.date().optional().nullable(),
  observacao: z.string().trim().max(1000).optional().nullable(),
  propostaId: z.string().optional().nullable(),
});

export const compromissoUpdateSchema = compromissoCreateSchema.extend({
  id: z.string().min(1),
});

export const compartilharAgendaSchema = z
  .object({
    viewerUsuarioId: z.string().optional().nullable(),
    viewerGrupoId: z.string().optional().nullable(),
  })
  .refine((v) => Boolean(v.viewerUsuarioId) !== Boolean(v.viewerGrupoId), {
    message: "Informe um usuário ou um grupo (apenas um)",
  });

export type CompromissoCreateInput = z.infer<typeof compromissoCreateSchema>;
export type CompromissoUpdateInput = z.infer<typeof compromissoUpdateSchema>;

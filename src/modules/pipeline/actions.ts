"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { requireRoles } from "@/src/lib/rbac";
import {
  atribuirAnalista,
  transicionarFase,
  transicaoFaseSchema,
} from "@/src/modules/pipeline/service";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const ROLES_ESCRITA = ["ADMIN", "COORDENADOR", "ANALISTA"] as const;

export async function transicionarFaseAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireRoles([...ROLES_ESCRITA]);
    const raw = {
      propostaId: String(formData.get("propostaId") ?? ""),
      novaFase: String(formData.get("novaFase") ?? ""),
      observacao: String(formData.get("observacao") ?? "") || undefined,
      motivo: String(formData.get("motivo") ?? "") || undefined,
      forcarComBloqueio: formData.get("forcarComBloqueio") === "on",
    };
    const parsed = transicaoFaseSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }
    await transicionarFase(parsed.data, session.user.id, session.user.role as Role);
    revalidatePath("/fila");
    revalidatePath(`/propostas/${parsed.data.propostaId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro na transição" };
  }
}

export async function atribuirAnalistaAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireRoles([...ROLES_ESCRITA]);
    const propostaId = String(formData.get("propostaId") ?? "");
    const analistaIdRaw = String(formData.get("analistaId") ?? "");
    const analistaId = analistaIdRaw === "" ? null : analistaIdRaw;
    await atribuirAnalista(
      propostaId,
      analistaId,
      session.user.id,
      session.user.role as Role,
    );
    revalidatePath("/fila");
    revalidatePath(`/propostas/${propostaId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao atribuir" };
  }
}

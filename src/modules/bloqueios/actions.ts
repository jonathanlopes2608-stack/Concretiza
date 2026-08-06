"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { requireRoles } from "@/src/lib/rbac";
import {
  abrirBloqueio,
  abrirBloqueioSchema,
  atualizarTipoDependencia,
  criarTipoDependencia,
  resolverBloqueio,
  tipoDependenciaSchema,
} from "@/src/modules/bloqueios/service";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const ROLES_ESCRITA = ["ADMIN", "COORDENADOR", "ANALISTA"] as const;
const ROLES_CONFIG = ["ADMIN", "COORDENADOR"] as const;

export async function abrirBloqueioAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRoles([...ROLES_ESCRITA]);
    const raw = {
      propostaId: String(formData.get("propostaId") ?? ""),
      tipoDependenciaId: String(formData.get("tipoDependenciaId") ?? ""),
      titulo: String(formData.get("titulo") ?? ""),
      descricao: String(formData.get("descricao") ?? "") || undefined,
      origem: "MANUAL" as const,
    };
    const parsed = abrirBloqueioSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }
    await abrirBloqueio(parsed.data, session.user.id, session.user.role as Role);
    revalidatePath(`/propostas/${parsed.data.propostaId}`);
    revalidatePath("/fila");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao abrir bloqueio" };
  }
}

export async function resolverBloqueioAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRoles([...ROLES_ESCRITA]);
    const bloqueioId = String(formData.get("bloqueioId") ?? "");
    const propostaId = String(formData.get("propostaId") ?? "");
    const observacao = String(formData.get("observacao") ?? "") || undefined;
    await resolverBloqueio(bloqueioId, session.user.id, session.user.role as Role, observacao);
    revalidatePath(`/propostas/${propostaId}`);
    revalidatePath("/fila");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao resolver bloqueio",
    };
  }
}

export async function criarTipoDependenciaAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireRoles([...ROLES_CONFIG]);
    const parsed = tipoDependenciaSchema.safeParse({
      codigo: String(formData.get("codigo") ?? ""),
      label: String(formData.get("label") ?? ""),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }
    await criarTipoDependencia(parsed.data);
    revalidatePath("/config/dependencias");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao criar tipo",
    };
  }
}

export async function toggleTipoDependenciaAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireRoles([...ROLES_CONFIG]);
    const id = String(formData.get("id") ?? "");
    const ativo = formData.get("ativo") === "true";
    await atualizarTipoDependencia(id, { ativo });
    revalidatePath("/config/dependencias");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar tipo",
    };
  }
}

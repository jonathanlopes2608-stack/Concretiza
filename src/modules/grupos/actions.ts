"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/src/lib/rbac";
import { normalizarPermissoes } from "@/src/lib/permissoes";
import { atualizarGrupo, criarGrupo } from "@/src/modules/grupos/service";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formBool(formData: FormData, key: string) {
  const values = formData.getAll(key).map(String);
  if (values.includes("true") || values.includes("on") || values.includes("1")) return true;
  return false;
}

function permissoesFromForm(formData: FormData) {
  return normalizarPermissoes(formData.getAll("permissoes").map(String));
}

export async function criarGrupoAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRoles(["ADMIN"]);
    const grupo = await criarGrupo({
      codigo: String(formData.get("codigo") ?? ""),
      nome: String(formData.get("nome") ?? ""),
      descricao: String(formData.get("descricao") ?? ""),
      permissoes: permissoesFromForm(formData),
      ativo: formBool(formData, "ativo"),
    });
    revalidatePath("/usuarios/grupos");
    revalidatePath("/usuarios");
    return { ok: true, data: { id: grupo.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao criar grupo",
    };
  }
}

export async function atualizarGrupoAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireRoles(["ADMIN"]);
    await atualizarGrupo({
      id: String(formData.get("id") ?? ""),
      nome: String(formData.get("nome") ?? ""),
      descricao: String(formData.get("descricao") ?? ""),
      permissoes: permissoesFromForm(formData),
      ativo: formBool(formData, "ativo"),
    });
    revalidatePath("/usuarios/grupos");
    revalidatePath("/usuarios");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar grupo",
    };
  }
}

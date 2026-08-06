"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/src/lib/rbac";
import {
  atualizarUsuario,
  criarUsuario,
} from "@/src/modules/usuarios/service";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function formBool(formData: FormData, key: string) {
  const values = formData.getAll(key).map(String);
  if (values.includes("true") || values.includes("on") || values.includes("1")) return true;
  return false;
}

export async function criarUsuarioAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRoles(["ADMIN"]);
    const user = await criarUsuario({
      email: String(formData.get("email") ?? ""),
      nome: String(formData.get("nome") ?? ""),
      sobrenome: String(formData.get("sobrenome") ?? ""),
      grupoId: String(formData.get("grupoId") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      ativo: formBool(formData, "ativo"),
    });
    revalidatePath("/usuarios");
    return { ok: true, data: { id: user.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao criar usuário",
    };
  }
}

export async function atualizarUsuarioAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRoles(["ADMIN"]);
    await atualizarUsuario(
      {
        id: String(formData.get("id") ?? ""),
        email: String(formData.get("email") ?? ""),
        nome: String(formData.get("nome") ?? ""),
        sobrenome: String(formData.get("sobrenome") ?? ""),
        grupoId: String(formData.get("grupoId") ?? ""),
        senha: String(formData.get("senha") ?? "") || undefined,
        ativo: formBool(formData, "ativo"),
      },
      session.user.id,
    );
    revalidatePath("/usuarios");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar usuário",
    };
  }
}

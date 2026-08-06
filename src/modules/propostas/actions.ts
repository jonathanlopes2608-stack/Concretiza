"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/src/lib/rbac";
import { calcularPrazoSla } from "@/src/lib/sla";
import {
  propostaCreateSchema,
  propostaUpdateSchema,
} from "@/src/modules/propostas/schema";
import {
  atualizarPropostaRecord,
  criarPropostaRecord,
  existeNumeroProcesso,
  existeNumeroProposta,
} from "@/src/modules/propostas/service";
import { importarLinhasExcel } from "@/src/modules/propostas/excel";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const ROLES_ESCRITA = ["ADMIN", "COORDENADOR", "ANALISTA"] as const;

function formToObject(formData: FormData) {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") obj[key] = value;
  }
  return obj;
}

export async function criarPropostaAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRoles([...ROLES_ESCRITA]);
    const parsed = propostaCreateSchema.safeParse(formToObject(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    if (
      parsed.data.numeroPropostaCaixa &&
      (await existeNumeroProposta(parsed.data.numeroPropostaCaixa))
    ) {
      return { ok: false, error: "Já existe proposta com este número Caixa" };
    }
    if (
      parsed.data.numeroProcessoInterno &&
      (await existeNumeroProcesso(parsed.data.numeroProcessoInterno))
    ) {
      return { ok: false, error: "Já existe processo com este número interno" };
    }

    const prazoSlaAte = await calcularPrazoSla("ENTRADA");
    const proposta = await criarPropostaRecord(
      parsed.data,
      "MANUAL",
      prazoSlaAte,
      session.user.id,
    );

    revalidatePath("/fila");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: proposta.id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao criar" };
  }
}

export async function atualizarPropostaAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRoles([...ROLES_ESCRITA]);
    const parsed = propostaUpdateSchema.safeParse(formToObject(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    if (
      parsed.data.numeroPropostaCaixa &&
      (await existeNumeroProposta(parsed.data.numeroPropostaCaixa, id))
    ) {
      return { ok: false, error: "Já existe proposta com este número Caixa" };
    }
    if (
      parsed.data.numeroProcessoInterno &&
      (await existeNumeroProcesso(parsed.data.numeroProcessoInterno, id))
    ) {
      return { ok: false, error: "Já existe processo com este número interno" };
    }

    await atualizarPropostaRecord(id, parsed.data);
    revalidatePath("/fila");
    revalidatePath(`/propostas/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao atualizar" };
  }
}

export async function importarExcelAction(
  formData: FormData,
): Promise<ActionResult<{ criadas: number; erros: string[] }>> {
  try {
    const session = await requireRoles([...ROLES_ESCRITA]);
    const file = formData.get("arquivo");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Selecione um arquivo Excel (.xlsx)" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resultado = await importarLinhasExcel(buffer, session.user.id);

    revalidatePath("/fila");
    revalidatePath("/dashboard");
    return {
      ok: true,
      data: { criadas: resultado.criadas, erros: resultado.erros },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro na importação",
    };
  }
}

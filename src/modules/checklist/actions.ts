"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/src/lib/auth";
import { parseDateInput } from "@/src/lib/dates";
import { requireRoles } from "@/src/lib/rbac";
import {
  atualizarStatusChecklist,
  anexarDocumento,
  removerDocumento,
  salvarValidadeChecklist,
} from "@/src/modules/checklist/service";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const ROLES = ["ADMIN", "COORDENADOR", "ANALISTA"] as const;

async function roleAtual(): Promise<Role> {
  const session = await requireRoles([...ROLES]);
  return session.user.role;
}

const statusSchema = z.object({
  respostaId: z.string().min(1),
  status: z.enum(["PENDENTE", "OK", "REPROVADO"]),
  observacao: z.string().optional(),
  propostaId: z.string().min(1),
});

export async function atualizarChecklistAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireRoles([...ROLES]);
    const parsed = statusSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    await atualizarStatusChecklist(
      parsed.data.respostaId,
      parsed.data.status,
      parsed.data.observacao,
      session.user.role,
      session.user.id,
    );
    revalidatePath(`/propostas/${parsed.data.propostaId}`);
    revalidatePath("/fila");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro" };
  }
}

export async function salvarValidadeAction(input: {
  respostaId: string;
  propostaId: string;
  validadeInformada: string;
}): Promise<ActionResult> {
  try {
    const role = await roleAtual();
    const validade = parseDateInput(input.validadeInformada);
    if (input.validadeInformada.trim() && !validade) {
      return { ok: false, error: "Data de validade inválida" };
    }
    await salvarValidadeChecklist(input.respostaId, validade, role);
    revalidatePath(`/propostas/${input.propostaId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro" };
  }
}

export async function uploadDocumentoAction(
  formData: FormData,
): Promise<ActionResult<{ validacaoStatus: string; mensagem?: string }>> {
  try {
    const role = await roleAtual();

    const respostaId = String(formData.get("respostaId") || "");
    const propostaId = String(formData.get("propostaId") || "");
    const file = formData.get("arquivo");

    if (!respostaId || !propostaId) {
      return { ok: false, error: "Item de checklist inválido" };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Selecione um arquivo" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { resultados } = await anexarDocumento(
      {
        checklistRespostaId: respostaId,
        nomeOriginal: file.name,
        mimeType: file.type || "application/octet-stream",
        buffer,
      },
      role,
    );

    const { consolidarStatus, mensagemConsolidada } = await import(
      "@/src/lib/conformidade-engine"
    );
    const status = consolidarStatus(resultados);

    revalidatePath(`/propostas/${propostaId}`);
    return {
      ok: true,
      data: {
        validacaoStatus: status,
        mensagem: mensagemConsolidada(resultados),
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro no upload" };
  }
}

export async function removerDocumentoAction(input: {
  documentoId: string;
  propostaId: string;
}): Promise<ActionResult> {
  try {
    const role = await roleAtual();
    await removerDocumento(input.documentoId, role);
    revalidatePath(`/propostas/${input.propostaId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao remover" };
  }
}

export async function obterRoleSessaoAction(): Promise<Role | null> {
  const session = await auth();
  return session?.user?.role ?? null;
}

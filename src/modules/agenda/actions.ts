"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { requireSession } from "@/src/lib/rbac";
import { temPermissao } from "@/src/lib/permissoes";
import { buildGoogleAuthUrl, googleOAuthConfigured } from "@/src/modules/agenda/google";
import {
  adicionarCompartilhamento,
  atualizarCalendarId,
  atualizarCompromisso,
  criarCompromisso,
  desconectarGoogle,
  excluirCompromisso,
  pullGoogleIncremental,
  removerCompartilhamento,
  salvarGoogleContaFromCode,
} from "@/src/modules/agenda/service";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function secretKey() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");
}

async function assertAgendaPerm(
  codigo: "acao.agenda.criar" | "acao.agenda.editar" | "acao.agenda.compartilhar" | "tela.agenda",
) {
  const session = await requireSession();
  const perms = session.user.permissoes ?? [];
  if (!perms.length) return session;
  if (codigo === "tela.agenda") {
    if (!temPermissao(perms, "tela.agenda")) throw new Error("Sem permissão");
    return session;
  }
  if (!temPermissao(perms, codigo) && !temPermissao(perms, "tela.agenda")) {
    throw new Error("Sem permissão");
  }
  if (!temPermissao(perms, codigo)) throw new Error("Sem permissão");
  return session;
}

export async function criarCompromissoAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertAgendaPerm("acao.agenda.criar");
    const c = await criarCompromisso(session.user.id, {
      titulo: String(formData.get("titulo") ?? ""),
      tipo: String(formData.get("tipo") ?? "OUTRO"),
      inicio: String(formData.get("inicio") ?? ""),
      fim: String(formData.get("fim") ?? "") || null,
      observacao: String(formData.get("observacao") ?? "") || null,
      propostaId: String(formData.get("propostaId") ?? "") || null,
    });
    revalidatePath("/agenda");
    return { ok: true, data: { id: c!.id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao criar" };
  }
}

export async function atualizarCompromissoAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAgendaPerm("acao.agenda.editar");
    await atualizarCompromisso(session.user.id, {
      id: String(formData.get("id") ?? ""),
      titulo: String(formData.get("titulo") ?? ""),
      tipo: String(formData.get("tipo") ?? "OUTRO"),
      inicio: String(formData.get("inicio") ?? ""),
      fim: String(formData.get("fim") ?? "") || null,
      observacao: String(formData.get("observacao") ?? "") || null,
      propostaId: String(formData.get("propostaId") ?? "") || null,
    });
    revalidatePath("/agenda");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao atualizar" };
  }
}

export async function excluirCompromissoAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAgendaPerm("acao.agenda.editar");
    await excluirCompromisso(session.user.id, String(formData.get("id") ?? ""));
    revalidatePath("/agenda");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao excluir" };
  }
}

export async function sincronizarGoogleAction(): Promise<ActionResult<{ imported: number; updated: number; removed: number }>> {
  try {
    const session = await assertAgendaPerm("tela.agenda");
    const stats = await pullGoogleIncremental(session.user.id);
    revalidatePath("/agenda");
    revalidatePath("/conta/integracoes");
    return { ok: true, data: stats };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao sincronizar" };
  }
}

export async function desconectarGoogleAction(): Promise<ActionResult> {
  try {
    const session = await assertAgendaPerm("tela.agenda");
    await desconectarGoogle(session.user.id);
    revalidatePath("/agenda");
    revalidatePath("/conta/integracoes");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao desconectar" };
  }
}

export async function atualizarCalendarGoogleAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAgendaPerm("tela.agenda");
    await atualizarCalendarId(session.user.id, String(formData.get("calendarId") ?? ""));
    revalidatePath("/agenda");
    revalidatePath("/conta/integracoes");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao salvar agenda",
    };
  }
}

export async function iniciarGoogleOAuthAction() {
  const session = await assertAgendaPerm("tela.agenda");
  if (!googleOAuthConfigured()) {
    throw new Error("Google OAuth não configurado (GOOGLE_CLIENT_ID / SECRET)");
  }
  const state = await new SignJWT({ uid: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(secretKey());
  redirect(buildGoogleAuthUrl(state));
}

export async function completarGoogleOAuth(code: string, state: string) {
  const { payload } = await jwtVerify(state, secretKey());
  const uid = String(payload.uid ?? "");
  if (!uid) throw new Error("State OAuth inválido");
  await salvarGoogleContaFromCode(uid, code);
  await pullGoogleIncremental(uid);
}

export async function compartilharAgendaAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAgendaPerm("acao.agenda.compartilhar");
    await adicionarCompartilhamento(session.user.id, {
      viewerUsuarioId: String(formData.get("viewerUsuarioId") ?? "") || null,
      viewerGrupoId: String(formData.get("viewerGrupoId") ?? "") || null,
    });
    revalidatePath("/agenda/compartilhar");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao compartilhar" };
  }
}

export async function removerCompartilhamentoAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAgendaPerm("acao.agenda.compartilhar");
    await removerCompartilhamento(session.user.id, String(formData.get("id") ?? ""));
    revalidatePath("/agenda/compartilhar");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao remover" };
  }
}

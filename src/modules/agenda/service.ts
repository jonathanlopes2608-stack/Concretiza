import { prisma } from "@/src/lib/db";
import { nomeCompleto } from "@/src/lib/grupos";
import {
  compromissoCreateSchema,
  compromissoUpdateSchema,
  compartilharAgendaSchema,
} from "@/src/modules/agenda/schema";
import {
  deleteCompromissoOnGoogle,
  getGoogleConta,
  getValidAccessToken,
  pullGoogleIncremental,
  pushCompromissoToGoogle,
} from "@/src/modules/agenda/sync";
import {
  encryptTokens,
  exchangeCodeForTokens,
  fetchGoogleEmail,
  googleOAuthConfigured,
  listGoogleCalendars,
} from "@/src/modules/agenda/google";

export { googleOAuthConfigured, getGoogleConta, pullGoogleIncremental };

export async function listarCompromissosVisiveis(
  usuarioId: string,
  grupoId: string | null | undefined,
  from: Date,
  to: Date,
) {
  const shares = await prisma.agendaCompartilhamento.findMany({
    where: {
      OR: [
        { viewerUsuarioId: usuarioId },
        ...(grupoId ? [{ viewerGrupoId: grupoId }] : []),
      ],
    },
    select: { donoId: true },
  });
  const donoIds = [...new Set([usuarioId, ...shares.map((s) => s.donoId)])];

  return prisma.compromisso.findMany({
    where: {
      usuarioId: { in: donoIds },
      inicio: { gte: from, lt: to },
    },
    orderBy: { inicio: "asc" },
    include: {
      usuario: { select: { id: true, nome: true, sobrenome: true } },
      proposta: {
        select: {
          id: true,
          numeroProcessoInterno: true,
          numeroPropostaCaixa: true,
          compradorNome: true,
        },
      },
    },
  });
}

export async function buscarCompromisso(id: string) {
  return prisma.compromisso.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nome: true, sobrenome: true } },
      proposta: {
        select: {
          id: true,
          numeroProcessoInterno: true,
          numeroPropostaCaixa: true,
          compradorNome: true,
        },
      },
    },
  });
}

export async function criarCompromisso(usuarioId: string, data: unknown) {
  const parsed = compromissoCreateSchema.parse(data);
  if (parsed.fim && parsed.fim < parsed.inicio) {
    throw new Error("Data fim deve ser após o início");
  }
  if (parsed.propostaId) {
    const p = await prisma.proposta.findUnique({
      where: { id: parsed.propostaId },
      select: { id: true },
    });
    if (!p) throw new Error("Proposta não encontrada");
  }

  const compromisso = await prisma.compromisso.create({
    data: {
      titulo: parsed.titulo,
      tipo: parsed.tipo,
      inicio: parsed.inicio,
      fim: parsed.fim ?? null,
      observacao: parsed.observacao || null,
      propostaId: parsed.propostaId || null,
      usuarioId,
      origem: "CONCRETIZA",
    },
  });

  await pushCompromissoToGoogle(compromisso.id);
  return buscarCompromisso(compromisso.id);
}

export async function atualizarCompromisso(
  usuarioId: string,
  data: unknown,
  podeEditarAlheio = false,
) {
  const parsed = compromissoUpdateSchema.parse(data);
  const atual = await prisma.compromisso.findUnique({ where: { id: parsed.id } });
  if (!atual) throw new Error("Compromisso não encontrado");
  if (atual.usuarioId !== usuarioId && !podeEditarAlheio) {
    throw new Error("Sem permissão para editar este compromisso");
  }
  if (parsed.fim && parsed.fim < parsed.inicio) {
    throw new Error("Data fim deve ser após o início");
  }

  const updated = await prisma.compromisso.update({
    where: { id: parsed.id },
    data: {
      titulo: parsed.titulo,
      tipo: parsed.tipo,
      inicio: parsed.inicio,
      fim: parsed.fim ?? null,
      observacao: parsed.observacao || null,
      propostaId: parsed.propostaId || null,
      origem: atual.origem === "GOOGLE" ? "GOOGLE" : "CONCRETIZA",
    },
  });

  await pushCompromissoToGoogle(updated.id);
  return buscarCompromisso(updated.id);
}

export async function excluirCompromisso(
  usuarioId: string,
  id: string,
  podeEditarAlheio = false,
) {
  const atual = await prisma.compromisso.findUnique({ where: { id } });
  if (!atual) throw new Error("Compromisso não encontrado");
  if (atual.usuarioId !== usuarioId && !podeEditarAlheio) {
    throw new Error("Sem permissão para excluir este compromisso");
  }
  await deleteCompromissoOnGoogle(atual.usuarioId, atual.googleEventId, atual.googleCalendarId);
  await prisma.compromisso.delete({ where: { id } });
}

export async function salvarGoogleContaFromCode(usuarioId: string, code: string) {
  const tokens = await exchangeCodeForTokens(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Google não retornou refresh token. Revogue o acesso do app em myaccount.google.com e conecte de novo.",
    );
  }
  const email = await fetchGoogleEmail(tokens.access_token);
  const enc = encryptTokens(tokens.access_token, tokens.refresh_token);
  return prisma.googleConta.upsert({
    where: { usuarioId },
    create: {
      usuarioId,
      emailGoogle: email,
      refreshTokenEnc: enc.refreshTokenEnc,
      accessTokenEnc: enc.accessTokenEnc,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      calendarId: "primary",
      ativo: true,
    },
    update: {
      emailGoogle: email,
      refreshTokenEnc: enc.refreshTokenEnc,
      accessTokenEnc: enc.accessTokenEnc,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      ativo: true,
      syncToken: null,
    },
  });
}

export async function desconectarGoogle(usuarioId: string) {
  await prisma.googleConta.deleteMany({ where: { usuarioId } });
}

export async function atualizarCalendarId(usuarioId: string, calendarId: string) {
  const id = calendarId.trim();
  if (!id) throw new Error("Informe a agenda Google");
  const conta = await prisma.googleConta.findUnique({ where: { usuarioId } });
  if (!conta?.ativo) throw new Error("Conecte o Google Calendar primeiro");
  return prisma.googleConta.update({
    where: { usuarioId },
    data: { calendarId: id, syncToken: null },
  });
}

export async function listarCalendariosDoUsuario(usuarioId: string) {
  const auth = await getValidAccessToken(usuarioId);
  if (!auth) return [];
  return listGoogleCalendars(auth.accessToken);
}

export async function listarCompartilhamentos(donoId: string) {
  const rows = await prisma.agendaCompartilhamento.findMany({
    where: { donoId },
    include: {
      viewerUsuario: { select: { id: true, nome: true, sobrenome: true, email: true } },
      viewerGrupo: { select: { id: true, nome: true, codigo: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    ...r,
    viewerLabel: r.viewerUsuario
      ? nomeCompleto(r.viewerUsuario.nome, r.viewerUsuario.sobrenome)
      : r.viewerGrupo?.nome ?? "—",
  }));
}

export async function adicionarCompartilhamento(donoId: string, data: unknown) {
  const parsed = compartilharAgendaSchema.parse(data);
  if (parsed.viewerUsuarioId === donoId) {
    throw new Error("Não é possível compartilhar consigo mesmo");
  }
  if (parsed.viewerUsuarioId) {
    const u = await prisma.usuario.findUnique({
      where: { id: parsed.viewerUsuarioId },
      select: { id: true },
    });
    if (!u) throw new Error("Usuário não encontrado");
    const exists = await prisma.agendaCompartilhamento.findFirst({
      where: { donoId, viewerUsuarioId: parsed.viewerUsuarioId },
    });
    if (exists) throw new Error("Já compartilhado com este usuário");
  }
  if (parsed.viewerGrupoId) {
    const g = await prisma.grupoUsuario.findUnique({
      where: { id: parsed.viewerGrupoId },
      select: { id: true },
    });
    if (!g) throw new Error("Grupo não encontrado");
    const exists = await prisma.agendaCompartilhamento.findFirst({
      where: { donoId, viewerGrupoId: parsed.viewerGrupoId },
    });
    if (exists) throw new Error("Já compartilhado com este grupo");
  }

  return prisma.agendaCompartilhamento.create({
    data: {
      donoId,
      viewerUsuarioId: parsed.viewerUsuarioId || null,
      viewerGrupoId: parsed.viewerGrupoId || null,
      nivel: "LEITURA",
    },
  });
}

export async function removerCompartilhamento(donoId: string, id: string) {
  const row = await prisma.agendaCompartilhamento.findUnique({ where: { id } });
  if (!row || row.donoId !== donoId) throw new Error("Compartilhamento não encontrado");
  await prisma.agendaCompartilhamento.delete({ where: { id } });
}

export async function listarUsuariosParaShare() {
  const rows = await prisma.usuario.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, sobrenome: true, email: true },
    orderBy: [{ nome: "asc" }, { sobrenome: "asc" }],
  });
  return rows.map((u) => ({
    id: u.id,
    label: `${nomeCompleto(u.nome, u.sobrenome)} <${u.email}>`,
  }));
}

export async function listarPropostasOpcoesAgenda() {
  return prisma.proposta.findMany({
    where: { faseAtual: { notIn: ["FINALIZADO", "CANCELADO", "REPROVADA"] } },
    select: {
      id: true,
      numeroProcessoInterno: true,
      numeroPropostaCaixa: true,
      compradorNome: true,
    },
    orderBy: { dataEntrada: "desc" },
    take: 200,
  });
}

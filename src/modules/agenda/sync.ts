import { prisma } from "@/src/lib/db";
import {
  decryptAccess,
  decryptRefresh,
  encryptTokens,
  googleCalendarRequest,
  listGoogleCalendars,
  refreshAccessToken,
  tzDefault,
  type GoogleEvent,
  type GoogleEventPayload,
} from "@/src/modules/agenda/google";

export { listGoogleCalendars };

export async function getGoogleConta(usuarioId: string) {
  return prisma.googleConta.findUnique({ where: { usuarioId } });
}

/** Obtém access token válido (renova se necessário). */
export async function getValidAccessToken(usuarioId: string): Promise<{
  accessToken: string;
  calendarId: string;
  contaId: string;
} | null> {
  const conta = await prisma.googleConta.findUnique({ where: { usuarioId } });
  if (!conta || !conta.ativo) return null;

  const now = Date.now();
  if (
    conta.accessTokenEnc &&
    conta.accessTokenExpiresAt &&
    conta.accessTokenExpiresAt.getTime() > now + 60_000
  ) {
    return {
      accessToken: decryptAccess(conta.accessTokenEnc),
      calendarId: conta.calendarId,
      contaId: conta.id,
    };
  }

  const refresh = decryptRefresh(conta.refreshTokenEnc);
  const tokens = await refreshAccessToken(refresh);
  const enc = encryptTokens(tokens.access_token, refresh);
  await prisma.googleConta.update({
    where: { id: conta.id },
    data: {
      accessTokenEnc: enc.accessTokenEnc,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return {
    accessToken: tokens.access_token,
    calendarId: conta.calendarId,
    contaId: conta.id,
  };
}

function toGooglePayload(input: {
  titulo: string;
  observacao?: string | null;
  inicio: Date;
  fim?: Date | null;
}): GoogleEventPayload {
  const tz = tzDefault();
  const fim = input.fim ?? new Date(input.inicio.getTime() + 60 * 60 * 1000);
  return {
    summary: input.titulo,
    description: input.observacao ?? undefined,
    start: { dateTime: input.inicio.toISOString(), timeZone: tz },
    end: { dateTime: fim.toISOString(), timeZone: tz },
  };
}

export async function pushCompromissoToGoogle(compromissoId: string) {
  const c = await prisma.compromisso.findUnique({ where: { id: compromissoId } });
  if (!c) return;
  const auth = await getValidAccessToken(c.usuarioId);
  if (!auth) return;

  const body = toGooglePayload(c);
  try {
    if (c.googleEventId) {
      const updated = await googleCalendarRequest<GoogleEvent>(
        auth.accessToken,
        `/calendars/${encodeURIComponent(auth.calendarId)}/events/${encodeURIComponent(c.googleEventId)}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      await prisma.compromisso.update({
        where: { id: c.id },
        data: {
          sincronizadoEm: new Date(),
          syncErro: null,
          googleCalendarId: auth.calendarId,
          googleUpdatedAt: updated.updated ? new Date(updated.updated) : new Date(),
        },
      });
    } else {
      const created = await googleCalendarRequest<GoogleEvent>(
        auth.accessToken,
        `/calendars/${encodeURIComponent(auth.calendarId)}/events`,
        { method: "POST", body: JSON.stringify(body) },
      );
      await prisma.compromisso.update({
        where: { id: c.id },
        data: {
          googleEventId: created.id,
          googleCalendarId: auth.calendarId,
          sincronizadoEm: new Date(),
          syncErro: null,
          googleUpdatedAt: created.updated ? new Date(created.updated) : new Date(),
        },
      });
    }
  } catch (e) {
    await prisma.compromisso.update({
      where: { id: c.id },
      data: { syncErro: e instanceof Error ? e.message : "Erro de sync Google" },
    });
  }
}

export async function deleteCompromissoOnGoogle(
  usuarioId: string,
  googleEventId: string | null | undefined,
  calendarId?: string | null,
) {
  if (!googleEventId) return;
  const auth = await getValidAccessToken(usuarioId);
  if (!auth) return;
  const cal = calendarId || auth.calendarId;
  try {
    await googleCalendarRequest(
      auth.accessToken,
      `/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(googleEventId)}`,
      { method: "DELETE" },
    );
  } catch {
    // evento já removido no Google — ok
  }
}

type EventsList = {
  items?: GoogleEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
};

export async function pullGoogleIncremental(usuarioId: string) {
  const auth = await getValidAccessToken(usuarioId);
  if (!auth) return { imported: 0, updated: 0, removed: 0 };

  const conta = await prisma.googleConta.findUniqueOrThrow({ where: { id: auth.contaId } });
  let imported = 0;
  let updated = 0;
  let removed = 0;
  let pageToken: string | undefined;
  let nextSyncToken = conta.syncToken ?? undefined;

  do {
    const params = new URLSearchParams({ singleEvents: "true" });
    if (conta.syncToken && !pageToken) {
      params.set("syncToken", conta.syncToken);
    } else {
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1);
      params.set("timeMin", timeMin.toISOString());
      params.set("maxResults", "100");
      if (pageToken) params.set("pageToken", pageToken);
    }

    let data: EventsList;
    try {
      data = await googleCalendarRequest<EventsList>(
        auth.accessToken,
        `/calendars/${encodeURIComponent(auth.calendarId)}/events?${params}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("410") && conta.syncToken) {
        await prisma.googleConta.update({
          where: { id: conta.id },
          data: { syncToken: null },
        });
        return pullGoogleIncremental(usuarioId);
      }
      throw e;
    }

    for (const ev of data.items ?? []) {
      if (!ev.id) continue;
      if (ev.status === "cancelled") {
        const del = await prisma.compromisso.deleteMany({
          where: { usuarioId, googleEventId: ev.id },
        });
        removed += del.count;
        continue;
      }
      const inicioStr = ev.start?.dateTime ?? ev.start?.date;
      if (!inicioStr) continue;
      const inicio = new Date(inicioStr);
      const fimStr = ev.end?.dateTime ?? ev.end?.date;
      const fim = fimStr ? new Date(fimStr) : null;
      const titulo = (ev.summary ?? "Evento Google").slice(0, 200);
      const observacao = ev.description?.slice(0, 1000) ?? null;
      const googleUpdatedAt = ev.updated ? new Date(ev.updated) : null;

      const existing = await prisma.compromisso.findFirst({
        where: { usuarioId, googleEventId: ev.id },
      });

      if (existing) {
        const localNewer =
          googleUpdatedAt && existing.updatedAt.getTime() > googleUpdatedAt.getTime() + 2000;
        if (localNewer && existing.origem === "CONCRETIZA") continue;
        await prisma.compromisso.update({
          where: { id: existing.id },
          data: {
            titulo,
            observacao,
            inicio,
            fim,
            googleCalendarId: auth.calendarId,
            sincronizadoEm: new Date(),
            syncErro: null,
            googleUpdatedAt,
          },
        });
        updated += 1;
      } else {
        await prisma.compromisso.create({
          data: {
            titulo,
            tipo: "OUTRO",
            inicio,
            fim,
            observacao,
            usuarioId,
            origem: "GOOGLE",
            googleEventId: ev.id,
            googleCalendarId: auth.calendarId,
            sincronizadoEm: new Date(),
            googleUpdatedAt,
          },
        });
        imported += 1;
      }
    }

    pageToken = data.nextPageToken;
    if (data.nextSyncToken) nextSyncToken = data.nextSyncToken;
  } while (pageToken);

  if (nextSyncToken) {
    await prisma.googleConta.update({
      where: { id: conta.id },
      data: { syncToken: nextSyncToken },
    });
  }

  return { imported, updated, removed };
}

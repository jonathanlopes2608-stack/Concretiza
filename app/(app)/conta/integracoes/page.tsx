import { redirect } from "next/navigation";
import { GoogleContaConfig } from "@/src/components/google-conta-config";
import { auth } from "@/src/lib/auth";
import { temPermissao } from "@/src/lib/permissoes";
import {
  getGoogleConta,
  googleOAuthConfigured,
  listarCalendariosDoUsuario,
} from "@/src/modules/agenda/service";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ google?: string; msg?: string }>;
};

export default async function IntegracoesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perms = session.user.permissoes ?? [];
  if (perms.length && !temPermissao(perms, "tela.agenda") && !temPermissao(perms, "tela.seguranca")) {
    redirect("/fila");
  }

  const params = await searchParams;
  const conta = await getGoogleConta(session.user.id);
  let calendarios: { id: string; summary: string; primary?: boolean }[] = [];
  if (conta?.ativo) {
    try {
      calendarios = await listarCalendariosDoUsuario(session.user.id);
    } catch {
      calendarios = [];
    }
  }

  const atualizadoEm = conta?.updatedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(conta.updatedAt)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-900">Integrações</h2>
        <p className="text-sm text-neutral-600">
          Configure a conta Google Calendar usada na sua agenda.
        </p>
      </div>

      {params.google === "ok" ? (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">
          Conta Google conectada com sucesso.
        </p>
      ) : null}
      {params.google === "erro" ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          Falha ao conectar: {params.msg ?? "erro"}
        </p>
      ) : null}

      <GoogleContaConfig
        conectado={Boolean(conta?.ativo)}
        emailGoogle={conta?.emailGoogle}
        calendarId={conta?.calendarId}
        atualizadoEm={atualizadoEm}
        oauthConfigured={googleOAuthConfigured()}
        calendarios={calendarios}
      />
    </div>
  );
}

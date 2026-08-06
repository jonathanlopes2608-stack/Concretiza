import Link from "next/link";
import { redirect } from "next/navigation";
import { AgendaLista } from "@/src/components/agenda-lista";
import { auth } from "@/src/lib/auth";
import { temPermissao } from "@/src/lib/permissoes";
import { prisma } from "@/src/lib/db";
import {
  getGoogleConta,
  listarCompromissosVisiveis,
  pullGoogleIncremental,
} from "@/src/modules/agenda/service";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ semana?: string }>;
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // segunda = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

export default async function AgendaPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perms = session.user.permissoes ?? [];
  if (perms.length && !temPermissao(perms, "tela.agenda")) redirect("/fila");

  const params = await searchParams;
  const base = params.semana ? new Date(params.semana) : new Date();
  const from = startOfWeek(base);
  const to = new Date(from);
  to.setDate(to.getDate() + 7);

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { grupoId: true },
  });

  const conta = await getGoogleConta(session.user.id);
  if (conta?.ativo) {
    try {
      await pullGoogleIncremental(session.user.id);
    } catch {
      // sync best-effort ao abrir
    }
  }

  const itens = await listarCompromissosVisiveis(
    session.user.id,
    user?.grupoId,
    from,
    to,
  );

  const prev = new Date(from);
  prev.setDate(prev.getDate() - 7);
  const next = new Date(from);
  next.setDate(next.getDate() + 7);

  const semanaLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(from);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Agenda</h2>
          <p className="text-sm text-neutral-600">
            Compromissos da semana e sync com Google Calendar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/conta/integracoes"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Conta Google
          </Link>
          <Link
            href="/agenda/compartilhar"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Compartilhar
          </Link>
          <Link
            href="/agenda/novo"
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            Novo compromisso
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-surface px-4 py-3 text-sm">
        {conta?.ativo ? (
          <p className="text-neutral-700">
            Google: <span className="font-medium text-brand-900">{conta.emailGoogle}</span>
            {" · "}
            <Link href="/conta/integracoes" className="text-brand-700 hover:underline">
              configurar
            </Link>
          </p>
        ) : (
          <p className="text-neutral-700">
            Google Calendar não conectado.{" "}
            <Link href="/conta/integracoes" className="text-brand-700 hover:underline">
              Conectar em Integrações
            </Link>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/agenda?semana=${prev.toISOString()}`}
          className="text-sm text-brand-700 hover:underline"
        >
          ← Semana anterior
        </Link>
        <p className="text-sm font-medium text-brand-900">Semana de {semanaLabel}</p>
        <Link
          href={`/agenda?semana=${next.toISOString()}`}
          className="text-sm text-brand-700 hover:underline"
        >
          Próxima semana →
        </Link>
      </div>

      <AgendaLista itens={itens} usuarioAtualId={session.user.id} />
    </div>
  );
}

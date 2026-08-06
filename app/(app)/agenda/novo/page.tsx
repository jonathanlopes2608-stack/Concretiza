import Link from "next/link";
import { redirect } from "next/navigation";
import { CompromissoForm } from "@/src/components/compromisso-form";
import { auth } from "@/src/lib/auth";
import { temPermissao } from "@/src/lib/permissoes";
import { listarPropostasOpcoesAgenda } from "@/src/modules/agenda/service";

export const dynamic = "force-dynamic";

export default async function NovoCompromissoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perms = session.user.permissoes ?? [];
  if (perms.length && !temPermissao(perms, "acao.agenda.criar") && !temPermissao(perms, "tela.agenda")) {
    redirect("/agenda");
  }

  const propostas = await listarPropostasOpcoesAgenda();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-900">Novo compromisso</h2>
        <Link href="/agenda" className="text-sm text-brand-700 hover:underline">
          Voltar
        </Link>
      </div>
      <CompromissoForm mode="create" propostas={propostas} />
    </div>
  );
}

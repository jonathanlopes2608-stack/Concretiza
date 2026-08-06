import Link from "next/link";
import { redirect } from "next/navigation";
import { AgendaCompartilharClient } from "@/src/components/agenda-compartilhar-client";
import { auth } from "@/src/lib/auth";
import { temPermissao } from "@/src/lib/permissoes";
import {
  listarCompartilhamentos,
  listarUsuariosParaShare,
} from "@/src/modules/agenda/service";
import { listarGrupos } from "@/src/modules/grupos/service";

export const dynamic = "force-dynamic";

export default async function AgendaCompartilharPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perms = session.user.permissoes ?? [];
  if (
    perms.length &&
    !temPermissao(perms, "acao.agenda.compartilhar") &&
    !temPermissao(perms, "tela.agenda")
  ) {
    redirect("/agenda");
  }

  const [shares, usuarios, grupos] = await Promise.all([
    listarCompartilhamentos(session.user.id),
    listarUsuariosParaShare(),
    listarGrupos(true),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Compartilhar agenda</h2>
          <p className="text-sm text-neutral-600">
            Defina quem pode ver seus compromissos no Concretiza (somente leitura).
          </p>
        </div>
        <Link href="/agenda" className="text-sm text-brand-700 hover:underline">
          Voltar
        </Link>
      </div>
      <AgendaCompartilharClient
        shares={shares}
        usuarios={usuarios.filter((u) => u.id !== session.user.id)}
        grupos={grupos.map((g) => ({ id: g.id, label: g.nome }))}
      />
    </div>
  );
}

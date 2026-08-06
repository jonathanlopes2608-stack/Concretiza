import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CompromissoForm } from "@/src/components/compromisso-form";
import { auth } from "@/src/lib/auth";
import { temPermissao } from "@/src/lib/permissoes";
import {
  buscarCompromisso,
  listarPropostasOpcoesAgenda,
} from "@/src/modules/agenda/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditarCompromissoPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perms = session.user.permissoes ?? [];
  if (perms.length && !temPermissao(perms, "tela.agenda")) redirect("/fila");

  const { id } = await params;
  const [c, propostas] = await Promise.all([
    buscarCompromisso(id),
    listarPropostasOpcoesAgenda(),
  ]);
  if (!c) notFound();

  const meu = c.usuarioId === session.user.id;
  const podeEditar =
    meu &&
    (!perms.length ||
      temPermissao(perms, "acao.agenda.editar") ||
      temPermissao(perms, "acao.agenda.criar"));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-900">
          {podeEditar ? "Editar compromisso" : "Ver compromisso"}
        </h2>
        <Link href="/agenda" className="text-sm text-brand-700 hover:underline">
          Voltar
        </Link>
      </div>
      <CompromissoForm
        mode="edit"
        readOnly={!podeEditar}
        propostas={propostas}
        initial={{
          id: c.id,
          titulo: c.titulo,
          tipo: c.tipo,
          inicio: c.inicio.toISOString(),
          fim: c.fim?.toISOString() ?? "",
          observacao: c.observacao ?? "",
          propostaId: c.propostaId ?? "",
        }}
      />
    </div>
  );
}

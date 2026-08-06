import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GrupoForm } from "@/src/components/grupo-form";
import { auth } from "@/src/lib/auth";
import { buscarGrupoPorId } from "@/src/modules/grupos/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditarGrupoPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/fila");

  const { id } = await params;
  const grupo = await buscarGrupoPorId(id);
  if (!grupo) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Editar grupo</h2>
          <p className="text-sm text-neutral-600">
            {grupo.nome}
            {grupo._count.usuarios > 0
              ? ` · ${grupo._count.usuarios} usuário(s)`
              : ""}
          </p>
        </div>
        <Link href="/usuarios/grupos" className="text-sm text-brand-700 hover:underline">
          Voltar
        </Link>
      </div>
      <GrupoForm
        mode="edit"
        initial={{
          id: grupo.id,
          codigo: grupo.codigo,
          nome: grupo.nome,
          descricao: grupo.descricao,
          role: grupo.role,
          permissoes: grupo.permissoes,
          ativo: grupo.ativo,
          sistema: grupo.sistema,
        }}
      />
    </div>
  );
}

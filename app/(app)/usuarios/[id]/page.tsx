import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UsuarioForm } from "@/src/components/usuario-form";
import { auth } from "@/src/lib/auth";
import {
  garantirGruposSistema,
  listarGrupos,
  vincularUsuariosSemGrupo,
} from "@/src/modules/grupos/service";
import { buscarUsuarioPorId } from "@/src/modules/usuarios/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditarUsuarioPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/fila");

  const { id } = await params;
  await garantirGruposSistema();
  await vincularUsuariosSemGrupo();

  const [usuario, grupos] = await Promise.all([
    buscarUsuarioPorId(id),
    listarGrupos(false),
  ]);
  if (!usuario) notFound();

  const gruposAtivos = grupos.filter(
    (g) => g.ativo || g.id === usuario.grupoId,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Editar usuário</h2>
          <p className="text-sm text-neutral-600">{usuario.nomeCompleto}</p>
        </div>
        <Link href="/usuarios" className="text-sm text-brand-700 hover:underline">
          Voltar
        </Link>
      </div>
      <UsuarioForm
        mode="edit"
        grupos={gruposAtivos.map((g) => ({
          id: g.id,
          nome: g.nome,
          descricao: g.descricao,
          role: g.role,
          permissoes: g.permissoes,
        }))}
        initial={{
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          sobrenome: usuario.sobrenome,
          grupoId: usuario.grupoId ?? gruposAtivos[0]?.id ?? "",
          ativo: usuario.ativo,
        }}
      />
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { UsuariosTable } from "@/src/components/usuarios-table";
import { auth } from "@/src/lib/auth";
import {
  garantirGruposSistema,
  vincularUsuariosSemGrupo,
} from "@/src/modules/grupos/service";
import { listarUsuarios } from "@/src/modules/usuarios/service";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/fila");

  await garantirGruposSistema();
  await vincularUsuariosSemGrupo();
  const usuarios = await listarUsuarios();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Gestão de usuários</h2>
          <p className="text-sm text-neutral-600">
            Cadastro por e-mail, nome, sobrenome e grupo de acesso.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/usuarios/grupos"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Grupos
          </Link>
          <Link
            href="/usuarios/novo"
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            Novo usuário
          </Link>
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-brand-900">Usuários ({usuarios.length})</h3>
        {usuarios.length === 0 ? (
          <p className="text-sm text-neutral-600">Nenhum usuário cadastrado.</p>
        ) : (
          <UsuariosTable usuarios={usuarios} />
        )}
      </section>
    </div>
  );
}

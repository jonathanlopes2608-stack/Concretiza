import Link from "next/link";
import { redirect } from "next/navigation";
import { GruposTable } from "@/src/components/grupos-table";
import { auth } from "@/src/lib/auth";
import {
  garantirGruposSistema,
  listarGrupos,
  vincularUsuariosSemGrupo,
} from "@/src/modules/grupos/service";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/fila");

  await garantirGruposSistema();
  await vincularUsuariosSemGrupo();
  const grupos = await listarGrupos(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Grupos de usuário</h2>
          <p className="text-sm text-neutral-600">
            Cadastre grupos e defina o perfil de acesso de cada um.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/usuarios" className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100">
            Usuários
          </Link>
          <Link
            href="/usuarios/grupos/novo"
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            Novo grupo
          </Link>
        </div>
      </div>
      <GruposTable grupos={grupos} />
    </div>
  );
}

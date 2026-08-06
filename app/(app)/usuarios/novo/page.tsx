import Link from "next/link";
import { redirect } from "next/navigation";
import { UsuarioForm } from "@/src/components/usuario-form";
import { auth } from "@/src/lib/auth";
import {
  garantirGruposSistema,
  listarGrupos,
  vincularUsuariosSemGrupo,
} from "@/src/modules/grupos/service";

export const dynamic = "force-dynamic";

export default async function NovoUsuarioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/fila");

  await garantirGruposSistema();
  await vincularUsuariosSemGrupo();
  const grupos = await listarGrupos(true);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Novo usuário</h2>
          <p className="text-sm text-neutral-600">
            Campos obrigatórios: e-mail, nome, sobrenome e grupo.
          </p>
        </div>
        <Link href="/usuarios" className="text-sm text-brand-700 hover:underline">
          Voltar
        </Link>
      </div>
      {grupos.length === 0 ? (
        <p className="text-sm text-amber-800">
          Cadastre um grupo ativo antes de criar usuários.{" "}
          <Link href="/usuarios/grupos/novo" className="underline">
            Novo grupo
          </Link>
        </p>
      ) : (
        <UsuarioForm
          mode="create"
          grupos={grupos.map((g) => ({
            id: g.id,
            nome: g.nome,
            descricao: g.descricao,
            role: g.role,
            permissoes: g.permissoes,
          }))}
        />
      )}
    </div>
  );
}

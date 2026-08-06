import Link from "next/link";
import { redirect } from "next/navigation";
import { GrupoForm } from "@/src/components/grupo-form";
import { auth } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function NovoGrupoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/fila");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Novo grupo</h2>
          <p className="text-sm text-neutral-600">
            Defina o nome e marque as telas e ações liberadas.
          </p>
        </div>
        <Link href="/usuarios/grupos" className="text-sm text-brand-700 hover:underline">
          Voltar
        </Link>
      </div>
      <GrupoForm mode="create" />
    </div>
  );
}

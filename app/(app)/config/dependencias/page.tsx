import Link from "next/link";
import { redirect } from "next/navigation";
import { DependenciasAdmin } from "@/src/components/dependencias-admin";
import { auth } from "@/src/lib/auth";
import { listarTiposDependencia } from "@/src/modules/bloqueios/service";

export const dynamic = "force-dynamic";

export default async function DependenciasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["ADMIN", "COORDENADOR"].includes(session.user.role)) {
    redirect("/fila");
  }

  const tipos = await listarTiposDependencia(false);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Tipos de dependência</h2>
          <p className="text-sm text-neutral-600">
            Quem pode ser o responsável por um bloqueio (cliente, cartório, etc.).
          </p>
        </div>
        <Link href="/fila" className="text-sm text-brand-700 hover:underline">
          Voltar
        </Link>
      </div>
      <DependenciasAdmin tipos={tipos} />
    </div>
  );
}

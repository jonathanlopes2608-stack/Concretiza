import { redirect } from "next/navigation";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/db";
import { Security2faPanel } from "@/src/components/security-2fa-panel";

export const dynamic = "force-dynamic";

export default async function SegurancaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-brand-900">Segurança da conta</h2>
        <p className="text-sm text-neutral-600">
          Configure a autenticação em duas etapas com aplicativo autenticador.
        </p>
      </div>
      <Security2faPanel twoFactorEnabled={user?.twoFactorEnabled ?? false} />
    </div>
  );
}

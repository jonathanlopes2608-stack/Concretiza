import { redirect } from "next/navigation";
import { auth } from "@/src/lib/auth";
import { AppShell } from "@/src/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell
      userName={session.user.name ?? ""}
      userRole={session.user.role}
      permissoes={session.user.permissoes ?? []}
    >
      {children}
    </AppShell>
  );
}

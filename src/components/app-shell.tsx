import Image from "next/image";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { branding } from "@/src/config/branding";
import { labelGrupo } from "@/src/lib/grupos";
import type { PermissaoCodigo } from "@/src/lib/permissoes";
import { temPermissao } from "@/src/lib/permissoes";
import { logoutAction } from "@/src/modules/auth/actions";

type NavItem = {
  href: string;
  label: string;
  ready: boolean;
  /** Se definido, exige a permissão (senão cai no filtro por role). */
  permissao?: PermissaoCodigo;
  roles?: Role[];
};

const navItems: NavItem[] = [
  { href: "/fila", label: "Fila", ready: true, permissao: "tela.fila" },
  { href: "/dashboard", label: "Dashboard", ready: true, permissao: "tela.dashboard" },
  { href: "/usuarios", label: "Usuários", ready: true, permissao: "tela.usuarios", roles: ["ADMIN"] },
  { href: "/usuarios/grupos", label: "Grupos", ready: true, permissao: "tela.grupos", roles: ["ADMIN"] },
  {
    href: "/config/dependencias",
    label: "Dependências",
    ready: true,
    permissao: "tela.dependencias",
    roles: ["ADMIN", "COORDENADOR"],
  },
  { href: "/agenda", label: "Agenda", ready: true, permissao: "tela.agenda" },
  { href: "/conta/integracoes", label: "Integrações", ready: true, permissao: "tela.agenda" },
  { href: "/conta/seguranca", label: "Segurança", ready: true, permissao: "tela.seguranca" },
];

type Props = {
  userName: string;
  userRole: Role;
  permissoes: PermissaoCodigo[];
  children: React.ReactNode;
};

export function AppShell({ userName, userRole, permissoes, children }: Props) {
  const hasPerms = permissoes.length > 0;
  const visibleNav = navItems.filter((item) => {
    if (item.permissao && hasPerms) return temPermissao(permissoes, item.permissao);
    if (item.roles) return item.roles.includes(userRole);
    return true;
  });

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-brand-900 text-white">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <Image
            src={branding.logo}
            alt={branding.name}
            width={40}
            height={40}
            className="rounded bg-white p-1"
          />
          <div>
            <p className="text-sm font-semibold tracking-wide">{branding.name}</p>
            <p className="text-xs text-white/70">{branding.tagline}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {visibleNav.map((item) =>
            item.ready ? (
              <Link
                key={item.label}
                href={item.href}
                className="rounded px-3 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="cursor-not-allowed rounded px-3 py-2 text-sm text-white/40"
                title="Em breve"
              >
                {item.label}
                <span className="ml-2 text-[10px] uppercase tracking-wide">em breve</span>
              </span>
            ),
          )}
        </nav>
        <div className="border-t border-white/10 p-4 text-sm">
          <p className="font-medium">{userName}</p>
          <p className="text-xs text-white/60">{labelGrupo(userRole)}</p>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="text-xs text-white/80 underline-offset-2 hover:underline"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-surface px-6 py-4">
          <h1 className="text-lg font-semibold text-brand-900">Operação</h1>
          <p className="text-sm text-neutral-600">Pipeline, conformidade e produtividade</p>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

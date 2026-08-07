"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Role } from "@prisma/client";
import type { PermissaoCodigo } from "@/src/lib/permissoes";
import { temPermissao } from "@/src/lib/permissoes";
import {
  getModuleHref,
  isProcessoPath,
  rememberModuleRoute,
  resolveModuleId,
  type NavModuleId,
} from "@/src/lib/nav-module-store";
import {
  IconAgenda,
  IconConfig,
  IconDashboard,
  IconFila,
  IconUsuarios,
} from "@/src/components/module-nav-icons";

type ModuleDef = {
  id: NavModuleId;
  label: string;
  defaultHref: string;
  permissao?: PermissaoCodigo;
  /** Se definido, exige qualquer uma destas permissões. */
  qualquerPermissao?: PermissaoCodigo[];
  roles?: Role[];
  Icon: (props: { className?: string }) => React.ReactNode;
};

const MODULES: ModuleDef[] = [
  { id: "fila", label: "FILA", defaultHref: "/fila", permissao: "tela.fila", Icon: IconFila },
  {
    id: "dashboard",
    label: "DASHBOARD",
    defaultHref: "/dashboard",
    permissao: "tela.dashboard",
    Icon: IconDashboard,
  },
  {
    id: "agenda",
    label: "AGENDA",
    defaultHref: "/agenda",
    permissao: "tela.agenda",
    Icon: IconAgenda,
  },
  {
    id: "usuarios",
    label: "USUÁRIOS",
    defaultHref: "/usuarios",
    qualquerPermissao: ["tela.usuarios", "tela.grupos"],
    roles: ["ADMIN"],
    Icon: IconUsuarios,
  },
  {
    id: "config",
    label: "CONFIG",
    defaultHref: "/config/dependencias",
    permissao: "tela.dependencias",
    roles: ["ADMIN", "COORDENADOR"],
    Icon: IconConfig,
  },
];

function canSeeModule(
  item: ModuleDef,
  permissoes: PermissaoCodigo[],
  userRole: Role,
): boolean {
  const hasPerms = permissoes.length > 0;
  if (item.qualquerPermissao?.length) {
    if (hasPerms) {
      return item.qualquerPermissao.some((p) => temPermissao(permissoes, p));
    }
    return item.roles ? item.roles.includes(userRole) : true;
  }
  if (item.permissao && hasPerms) return temPermissao(permissoes, item.permissao);
  if (item.roles) return item.roles.includes(userRole);
  return true;
}

function moduleFallback(
  item: ModuleDef,
  permissoes: PermissaoCodigo[],
  userRole: Role,
): string {
  if (item.id !== "usuarios") return item.defaultHref;
  const hasPerms = permissoes.length > 0;
  const canUsers = hasPerms
    ? temPermissao(permissoes, "tela.usuarios")
    : userRole === "ADMIN";
  const canGrupos = hasPerms
    ? temPermissao(permissoes, "tela.grupos")
    : userRole === "ADMIN";
  if (!canUsers && canGrupos) return "/usuarios/grupos";
  return "/usuarios";
}

function isModuleActive(id: NavModuleId, pathname: string): boolean {
  if (id === "fila") {
    return (
      pathname === "/fila" ||
      pathname.startsWith("/fila/") ||
      isProcessoPath(pathname) ||
      pathname.startsWith("/propostas/")
    );
  }
  const resolved = resolveModuleId(pathname);
  return resolved === id;
}

type Props = {
  userRole: Role;
  permissoes: PermissaoCodigo[];
};

/** Persiste rota atual e renderiza a barra horizontal de módulos. */
export function ModuleNav({ userRole, permissoes }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hrefs, setHrefs] = useState<Partial<Record<NavModuleId, string>>>({});
  const permsKey = permissoes.join(",");

  const visible = useMemo(
    () => MODULES.filter((m) => canSeeModule(m, permissoes, userRole)),
    [permissoes, userRole],
  );

  useEffect(() => {
    const moduleId = resolveModuleId(pathname);
    if (!moduleId) return;
    // Detalhe de processo não sobrescreve filtros da fila
    if (moduleId === "fila" && isProcessoPath(pathname)) return;
    if (pathname.startsWith("/propostas/")) return;

    const qs = searchParams.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    rememberModuleRoute(moduleId, href);
    setHrefs((prev) => (prev[moduleId] === href ? prev : { ...prev, [moduleId]: href }));
  }, [pathname, searchParams]);

  useEffect(() => {
    const next: Partial<Record<NavModuleId, string>> = {};
    for (const m of MODULES) {
      next[m.id] = getModuleHref(m.id, moduleFallback(m, permissoes, userRole));
    }
    setHrefs(next);
  }, [permsKey, userRole, permissoes]);

  return (
    <nav
      className="flex min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto px-1.5 [-webkit-overflow-scrolling:touch] md:overflow-x-visible"
      aria-label="Módulos"
    >
      {visible.map((item) => {
        const active = isModuleActive(item.id, pathname);
        const href = hrefs[item.id] ?? moduleFallback(item, permissoes, userRole);
        const Icon = item.Icon;
        return (
          <Link
            key={item.id}
            href={href}
            title={item.label}
            className={`flex min-w-[6.8rem] shrink-0 flex-col items-center justify-center gap-0.5 px-4 py-3 text-center transition-colors sm:min-w-[8rem] sm:px-5 ${
              active
                ? "bg-white text-brand-900"
                : "text-white/90 hover:bg-white/10"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="shrink-0" />
            <span className="text-[14px] font-semibold uppercase tracking-wider sm:text-[16px]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

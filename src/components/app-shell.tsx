"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import type { Branding } from "@/src/config/branding";
import { labelGrupo } from "@/src/lib/grupos";
import type { PermissaoCodigo } from "@/src/lib/permissoes";
import { temPermissao } from "@/src/lib/permissoes";
import { logoutAction } from "@/src/modules/auth/actions";
import { ModuleNav } from "@/src/components/module-nav";
import { ProcessTabs } from "@/src/components/process-tabs";
import { IconConta } from "@/src/components/module-nav-icons";
import {
  getModuleHref,
  rememberModuleRoute,
} from "@/src/lib/nav-module-store";

type ContaLink = {
  href: string;
  label: string;
  permissao?: PermissaoCodigo;
};

const contaLinks: ContaLink[] = [
  { href: "/conta/integracoes", label: "Integrações", permissao: "tela.agenda" },
  { href: "/conta/seguranca", label: "Segurança", permissao: "tela.seguranca" },
];

type Props = {
  userName: string;
  userRole: Role;
  permissoes: PermissaoCodigo[];
  branding: Branding;
  children: React.ReactNode;
};

function ContaMenu({
  permissoes,
  pathname,
}: {
  permissoes: PermissaoCodigo[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const [contaHref, setContaHref] = useState("/conta/integracoes");
  const ref = useRef<HTMLDivElement>(null);
  const hasPerms = permissoes.length > 0;
  const links = contaLinks.filter((item) => {
    if (item.permissao && hasPerms) return temPermissao(permissoes, item.permissao);
    return true;
  });
  const firstHref = links[0]?.href ?? "/conta/integracoes";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setContaHref(getModuleHref("conta", firstHref));
  }, [pathname, firstHref]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (links.length === 0) return null;

  const contaActive = pathname.startsWith("/conta");

  return (
    <div className="relative flex shrink-0" ref={ref}>
      <Link
        href={contaHref}
        className={`flex min-w-[6.8rem] flex-col items-center justify-center gap-0.5 px-4 py-3 sm:min-w-[8rem] sm:px-5 ${
          contaActive ? "bg-white text-brand-900" : "text-white/90 hover:bg-white/10"
        }`}
        title="Conta"
        aria-current={contaActive ? "page" : undefined}
      >
        <IconConta />
        <span className="text-[14px] font-semibold uppercase tracking-wider sm:text-[16px]">
          CONTA
        </span>
      </Link>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`px-2 ${
          contaActive ? "bg-white text-brand-900" : "text-white/80 hover:bg-white/10"
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Mais opções da conta"
      >
        <svg viewBox="0 0 12 12" width="20" height="20" aria-hidden>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[22rem] rounded-b-md border border-slate-200 bg-white py-2 shadow-lg"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              className={`block px-6 py-4 text-[28px] hover:bg-neutral-100 ${
                pathname === l.href || pathname.startsWith(l.href + "/")
                  ? "font-medium text-brand-700"
                  : "text-brand-900"
              }`}
              onClick={() => {
                rememberModuleRoute("conta", l.href);
                setOpen(false);
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({
  userName,
  userRole,
  permissoes,
  branding,
  children,
}: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <header className="sticky top-0 z-40 flex items-stretch border-b border-brand-900/20 bg-brand-900 text-white shadow-sm">
        <Link
          href="/fila"
          className="flex shrink-0 items-center gap-4 border-r border-white/10 px-6 py-4 sm:px-8"
          title={branding.name}
        >
          <Image
            src={branding.logo}
            alt={branding.name}
            width={80}
            height={80}
            className="h-[4.5rem] w-[4.5rem] rounded bg-white object-contain p-1 sm:h-20 sm:w-20"
            priority
          />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[28px] font-semibold tracking-wide">{branding.name}</p>
            {branding.slogan ? (
              <p className="truncate text-[20px] text-white/65">{branding.slogan}</p>
            ) : null}
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 items-stretch">
          <Suspense
            fallback={
              <div className="min-w-0 flex-1" aria-hidden />
            }
          >
            <ModuleNav userRole={userRole} permissoes={permissoes} />
          </Suspense>
          <ContaMenu permissoes={permissoes} pathname={pathname} />
        </div>

        <div className="flex w-[13.5rem] shrink-0 items-center gap-2 border-l border-white/10 px-3 py-3 sm:w-[15rem] sm:gap-3 sm:px-4">
          <div className="hidden min-w-0 flex-1 text-right sm:block">
            <p className="truncate text-[13px] font-medium leading-tight sm:text-[14px]" title={userName || "Usuário"}>
              {userName || "Usuário"}
            </p>
            <p className="truncate text-[11px] leading-tight text-white/65 sm:text-[12px]">
              {labelGrupo(userRole)}
            </p>
          </div>
          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="rounded-md border border-white/25 px-3 py-2 text-[14px] font-medium text-white hover:bg-white/10 sm:px-4 sm:text-[15px]"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <ProcessTabs />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}

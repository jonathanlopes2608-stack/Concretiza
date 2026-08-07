"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  closeProcessTab,
  getProcessTabs,
  hydrateProcessTabs,
  subscribeProcessTabs,
} from "@/src/lib/process-tabs-store";
import { getFilaHref } from "@/src/lib/nav-module-store";

const FILA_FALLBACK = "/fila";

function useProcessTabs() {
  return useSyncExternalStore(
    subscribeProcessTabs,
    getProcessTabs,
    () => [] as ReturnType<typeof getProcessTabs>,
  );
}

/** Extrai id de `/propostas/[id]` (não editar/nova/importar). */
export function parseProcessoDetalheId(pathname: string): string | null {
  const m = pathname.match(/^\/propostas\/([^/]+)\/?$/);
  if (!m) return null;
  const id = m[1];
  if (id === "nova" || id === "importar") return null;
  return id;
}

function isFilaPath(pathname: string): boolean {
  return pathname === FILA_FALLBACK || pathname.startsWith(`${FILA_FALLBACK}/`);
}

/** Tabstrip só no módulo Fila (lista + detalhe/edição de processos). */
export function isProcessTabsPath(pathname: string): boolean {
  return isFilaPath(pathname) || pathname.startsWith("/propostas/");
}

export function ProcessTabs() {
  const tabs = useProcessTabs();
  const pathname = usePathname();
  const router = useRouter();
  const activeId = parseProcessoDetalheId(pathname);
  const filaActive = isFilaPath(pathname);
  const [filaHref, setFilaHref] = useState(FILA_FALLBACK);
  const visible = isProcessTabsPath(pathname);

  useEffect(() => {
    hydrateProcessTabs();
  }, []);

  useEffect(() => {
    setFilaHref(getFilaHref());
  }, [pathname]);

  function onClose(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const remaining = closeProcessTab(id);
    if (activeId === id) {
      const next = remaining[remaining.length - 1];
      router.push(next ? `/propostas/${next.id}` : getFilaHref());
    }
  }

  if (!visible) return null;

  return (
    <div
      className="flex items-end gap-1 overflow-x-auto border-b border-slate-200 bg-neutral-100/80 px-3 pt-3 [-webkit-overflow-scrolling:touch]"
      role="tablist"
      aria-label="Fila e processos abertos"
    >
      <div
        role="tab"
        aria-selected={filaActive}
        className={`flex max-w-[12rem] shrink-0 items-center rounded-t-lg border border-b-0 px-4 py-2.5 text-[1.125rem] leading-snug ${
          filaActive
            ? "border-slate-200 bg-surface text-brand-900 shadow-sm"
            : "border-transparent bg-transparent text-neutral-600 hover:bg-white/70"
        }`}
      >
        <Link
          href={filaHref}
          className="min-w-0 truncate font-medium"
          title="Fila"
        >
          Fila
        </Link>
      </div>

      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={active}
            className={`group flex max-w-[18rem] shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-4 py-2.5 text-[1.125rem] leading-snug ${
              active
                ? "border-slate-200 bg-surface text-brand-900 shadow-sm"
                : "border-transparent bg-transparent text-neutral-600 hover:bg-white/70"
            }`}
          >
            <Link
              href={`/propostas/${tab.id}`}
              className="min-w-0 truncate font-medium"
              title={tab.title}
            >
              {tab.title}
            </Link>
            <button
              type="button"
              onClick={(e) => onClose(e, tab.id)}
              className="shrink-0 rounded p-[0.1875rem] text-neutral-400 hover:bg-slate-200 hover:text-brand-900"
              aria-label={`Fechar aba ${tab.title}`}
            >
              <svg viewBox="0 0 12 12" width="15" height="15" aria-hidden>
                <path
                  d="M2 2l8 8M10 2L2 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

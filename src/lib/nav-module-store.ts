/**
 * Última rota por módulo + query da fila (sessionStorage).
 * Ao trocar de módulo e voltar, restaura subrota/filtros em vez de “zerar”.
 */

export type NavModuleId =
  | "fila"
  | "dashboard"
  | "agenda"
  | "usuarios"
  | "config"
  | "conta";

const STORAGE_KEY = "concretiza.nav.modules";

type Store = Partial<Record<NavModuleId, string>>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

/** Associa pathname ao módulo de navegação (ou null se não for módulo de menu). */
export function resolveModuleId(pathname: string): NavModuleId | null {
  if (pathname === "/fila" || pathname.startsWith("/fila/")) return "fila";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/usuarios")) return "usuarios";
  if (pathname.startsWith("/config")) return "config";
  if (pathname.startsWith("/conta")) return "conta";
  return null;
}

/** Processos abertos pertencem ao fluxo da fila, mas não sobrescrevem filtros. */
export function isProcessoPath(pathname: string): boolean {
  return /^\/propostas\/[^/]+\/?$/.test(pathname);
}

export function rememberModuleRoute(moduleId: NavModuleId, href: string) {
  if (!href.startsWith("/")) return;
  const store = readStore();
  if (store[moduleId] === href) return;
  store[moduleId] = href;
  writeStore(store);
}

export function getModuleHref(moduleId: NavModuleId, fallback: string): string {
  const stored = readStore()[moduleId];
  if (stored && stored.startsWith("/")) return stored;
  return fallback;
}

export function getFilaHref(): string {
  return getModuleHref("fila", "/fila");
}

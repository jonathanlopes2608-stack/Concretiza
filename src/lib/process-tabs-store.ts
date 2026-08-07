/**
 * Abas de detalhe de processo (`/propostas/[id]`).
 * A aba fixa "Fila" é renderizada em `ProcessTabs` (não fica neste store).
 */

export type ProcessTab = {
  id: string;
  title: string;
};

const STORAGE_KEY = "concretiza.process.tabs";

type Listener = () => void;

let tabs: ProcessTab[] = [];
let hydrated = false;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch {
    /* ignore quota */
  }
}

export function hydrateProcessTabs() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    tabs = parsed
      .filter(
        (t): t is ProcessTab =>
          !!t &&
          typeof t === "object" &&
          typeof (t as ProcessTab).id === "string" &&
          typeof (t as ProcessTab).title === "string",
      )
      .slice(0, 20);
  } catch {
    tabs = [];
  }
  notify();
}

export function getProcessTabs(): ProcessTab[] {
  return tabs;
}

export function subscribeProcessTabs(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openProcessTab(id: string, title?: string) {
  hydrateProcessTabs();
  const label = (title?.trim() || id.slice(0, 8)).slice(0, 40);
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx >= 0) {
    if (title?.trim() && tabs[idx].title !== label) {
      tabs = tabs.map((t, i) => (i === idx ? { ...t, title: label } : t));
      persist();
      notify();
    }
    return;
  }
  tabs = [...tabs, { id, title: label }];
  persist();
  notify();
}

export function closeProcessTab(id: string): ProcessTab[] {
  hydrateProcessTabs();
  tabs = tabs.filter((t) => t.id !== id);
  persist();
  notify();
  return tabs;
}

export function clearProcessTabs() {
  tabs = [];
  persist();
  notify();
}

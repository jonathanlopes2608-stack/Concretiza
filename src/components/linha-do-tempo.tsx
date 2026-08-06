"use client";

import { useEffect, useId, useState } from "react";
import type { DiaLinhaDoTempo } from "@/src/lib/linha-do-tempo";

type Props = {
  dias: DiaLinhaDoTempo[];
  atualizadoEmLabel: string;
};

export function LinhaDoTempoTrigger({ dias, atualizadoEmLabel }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-neutral-100"
        title="Ver linha do tempo do processo"
      >
        Linha do tempo
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="relative my-4 w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
              aria-label="Fechar"
            >
              ✕
            </button>

            <div className="px-6 pb-8 pt-8 sm:px-10">
              <h3
                id={titleId}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-900"
              >
                Linha do tempo
              </h3>
              <div className="mt-2 border-b border-dotted border-slate-300" />

              {dias.length === 0 ? (
                <p className="mt-10 text-center text-sm text-neutral-600">
                  Ainda não há eventos registrados neste processo.
                </p>
              ) : (
                <ol className="mt-10 space-y-10">
                  {dias.map((dia, i) => {
                    const direita = i % 2 === 1;
                    return (
                      <li
                        key={dia.dataKey}
                        className={`flex ${direita ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`w-[min(100%,18rem)] sm:w-[42%] ${
                            direita ? "text-left" : "text-right"
                          }`}
                        >
                          <p className="text-base font-bold text-brand-900">{dia.dataLabel}</p>
                          <ul className="mt-1 space-y-0.5">
                            {dia.eventos.map((ev) => (
                              <li
                                key={ev.id}
                                className="text-sm font-medium text-amber-600"
                              >
                                {ev.texto}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              <p className="mt-12 text-right text-xs font-medium text-amber-600">
                {atualizadoEmLabel}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

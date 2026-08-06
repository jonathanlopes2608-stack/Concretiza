import type { FaseProcesso } from "@prisma/client";
import { FASE_LABELS } from "@/src/lib/fases";

const colors: Record<FaseProcesso, string> = {
  ENTRADA: "bg-gray-100 text-gray-700",
  ANALISE: "bg-blue-100 text-brand-700",
  RESTRICAO: "bg-orange-100 text-orange-800",
  ENGENHARIA: "bg-violet-100 text-violet-800",
  DEBITO_FGTS: "bg-amber-100 text-amber-800",
  CONFORMIDADE: "bg-sky-100 text-sky-800",
  DECISAO: "bg-indigo-100 text-indigo-800",
  EM_CARTORIO: "bg-teal-100 text-teal-800",
  FORMALIZACAO: "bg-cyan-100 text-cyan-800",
  FINALIZADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-neutral-200 text-neutral-700",
  REPROVADA: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: FaseProcesso }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${colors[status]}`}
    >
      {FASE_LABELS[status]}
    </span>
  );
}

export function FaseBadge({ fase }: { fase: FaseProcesso }) {
  return <StatusBadge status={fase} />;
}

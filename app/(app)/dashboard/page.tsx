import Link from "next/link";
import { obterMetricasDashboard } from "@/src/modules/dashboard/service";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ dias?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const dias = Number(params.dias) === 7 || Number(params.dias) === 90 ? Number(params.dias) : 30;
  const m = await obterMetricasDashboard(dias);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Dashboard de produtividade</h2>
          <p className="text-sm text-neutral-600">
            Funil, gargalos e produção — últimos {m.periodoDias} dias.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/dashboard?dias=${d}`}
              className={`rounded-md px-3 py-1.5 ${
                dias === d
                  ? "bg-brand-700 text-white"
                  : "border border-slate-300 hover:bg-neutral-100"
              }`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Finalizados no período" value={String(m.finalizadosPeriodo)} />
        <Stat label="SLA estourado (ativos)" value={String(m.slaEstourado)} accent="text-red-700" />
        <Stat
          label="Bloqueios abertos"
          value={String(m.travadosPorDependencia.reduce((s, x) => s + x.total, 0))}
          accent="text-amber-800"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Funil por fase">
          <table className="w-full text-sm">
            <tbody>
              {m.funil
                .filter((f) => f.total > 0)
                .map((f) => (
                  <tr key={f.fase} className="border-b border-slate-50">
                    <td className="py-1.5 text-neutral-700">{f.label}</td>
                    <td className="py-1.5 text-right font-semibold text-brand-900">{f.total}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {m.funil.every((f) => f.total === 0) ? (
            <p className="text-sm text-neutral-500">Sem processos.</p>
          ) : null}
        </Panel>

        <Panel title="Travados por dependência">
          {m.travadosPorDependencia.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum bloqueio aberto.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {m.travadosPorDependencia.map((t) => (
                  <tr key={t.codigo} className="border-b border-slate-50">
                    <td className="py-1.5 text-neutral-700">{t.label}</td>
                    <td className="py-1.5 text-right font-semibold text-amber-800">{t.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Aging médio na fase (dias)">
          {m.agingFase.length === 0 ? (
            <p className="text-sm text-neutral-500">Sem processos ativos.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500">
                  <th className="pb-1 font-medium">Fase</th>
                  <th className="pb-1 text-right font-medium">Média</th>
                  <th className="pb-1 text-right font-medium">Qtde</th>
                </tr>
              </thead>
              <tbody>
                {m.agingFase.map((a) => (
                  <tr key={a.fase} className="border-b border-slate-50">
                    <td className="py-1.5">{a.label}</td>
                    <td className="py-1.5 text-right font-semibold">{a.mediaDias}</td>
                    <td className="py-1.5 text-right text-neutral-600">{a.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Por analista">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="pb-1 font-medium">Analista</th>
                <th className="pb-1 text-right font-medium">Ativas</th>
                <th className="pb-1 text-right font-medium">Finaliz.</th>
                <th className="pb-1 text-right font-medium">SLA+</th>
              </tr>
            </thead>
            <tbody>
              {m.porAnalista.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="py-1.5">{a.nome}</td>
                  <td className="py-1.5 text-right">{a.ativas}</td>
                  <td className="py-1.5 text-right">{a.finalizadas}</td>
                  <td className={`py-1.5 text-right ${a.slaEstourado ? "font-semibold text-red-700" : ""}`}>
                    {a.slaEstourado}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <p className="text-xs text-neutral-500">
        Tempo na fase usa o último evento de histórico. Bloqueios abertos representam espera de
        terceiros (cliente, despachante, engenharia, etc.).
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-surface p-4">
      <p className="text-xs text-neutral-600">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ?? "text-brand-900"}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-brand-900">{title}</h3>
      {children}
    </section>
  );
}

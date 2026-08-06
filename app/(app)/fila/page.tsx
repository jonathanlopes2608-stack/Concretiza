import Link from "next/link";
import type { FaseProcesso } from "@prisma/client";
import { FilaTable, parseFilaOrdenacao } from "@/src/components/fila-table";
import { listarTiposDependencia } from "@/src/modules/bloqueios/service";
import { obterFila } from "@/src/modules/fila/service";
import { listarAnalistasOpcoes } from "@/src/modules/usuarios/service";

export const dynamic = "force-dynamic";

const fasesValidas = new Set<FaseProcesso>([
  "ENTRADA",
  "ANALISE",
  "RESTRICAO",
  "ENGENHARIA",
  "DEBITO_FGTS",
  "CONFORMIDADE",
  "DECISAO",
  "EM_CARTORIO",
  "FORMALIZACAO",
  "FINALIZADO",
  "CANCELADO",
  "REPROVADA",
]);

type Props = {
  searchParams: Promise<{
    fase?: string;
    busca?: string;
    tipoDependenciaId?: string;
    soTravados?: string;
    slaEstourado?: string;
    analistaId?: string;
    ordenar?: string;
    dir?: string;
  }>;
};

export default async function FilaPage({ searchParams }: Props) {
  const params = await searchParams;
  const fase =
    params.fase && fasesValidas.has(params.fase as FaseProcesso)
      ? (params.fase as FaseProcesso)
      : undefined;
  const { ordenar, dir } = parseFilaOrdenacao(params.ordenar, params.dir);

  const [propostas, tipos, analistas] = await Promise.all([
    obterFila({
      fase,
      busca: params.busca,
      tipoDependenciaId: params.tipoDependenciaId || undefined,
      soTravados: params.soTravados === "1",
      slaEstourado: params.slaEstourado === "1",
      analistaId: params.analistaId || undefined,
      ordenar,
      dir,
    }),
    listarTiposDependencia(true),
    listarAnalistasOpcoes(),
  ]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Fila de processos</h2>
          <p className="text-sm text-neutral-600">
            Fase, bloqueios, SLA e atribuição — onde cada processo está parado.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/propostas/nova"
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            Nova proposta
          </Link>
          <Link
            href="/propostas/importar"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Importar Excel
          </Link>
          <a
            href="/api/fila/export"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Exportar CSV
          </a>
        </div>
      </div>
      <FilaTable
        propostas={propostas}
        faseFiltro={params.fase ?? ""}
        busca={params.busca ?? ""}
        tipoDependenciaId={params.tipoDependenciaId ?? ""}
        soTravados={params.soTravados === "1"}
        slaEstourado={params.slaEstourado === "1"}
        analistaId={params.analistaId ?? ""}
        tiposDependencia={tipos}
        analistas={analistas}
        ordenar={ordenar ?? ""}
        dir={dir}
      />
    </div>
  );
}

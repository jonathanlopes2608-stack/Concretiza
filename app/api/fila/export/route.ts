import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { FASE_LABELS } from "@/src/lib/fases";
import { listarFila } from "@/src/modules/propostas/repository";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const propostas = await listarFila({});
  const header = [
    "processoInterno",
    "numeroCaixa",
    "cliente",
    "cpf",
    "fase",
    "paradoEm",
    "analista",
    "despachante",
    "sla",
    "entrada",
  ];
  const lines = [header.join(";")];
  for (const p of propostas) {
    const parado =
      p.bloqueiosAbertos[0] != null
        ? `${p.bloqueiosAbertos[0].tipoDependencia.label}: ${p.bloqueiosAbertos[0].titulo}`
        : p.bloqueioResumo ?? "";
    lines.push(
      [
        p.numeroProcessoInterno ?? "",
        p.numeroPropostaCaixa ?? "",
        p.compradorNome,
        p.compradorCpf,
        FASE_LABELS[p.faseAtual],
        parado,
        p.analista?.nome ?? "",
        p.despachanteNome ?? "",
        p.prazoSlaAte?.toISOString() ?? "",
        p.dataEntrada.toISOString(),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(";"),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fila-concretiza.csv"',
    },
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/db";
import { gerarFormularioCadastroPdf } from "@/src/modules/propostas/formulario-pdf";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const proposta = await prisma.proposta.findUnique({
    where: { id },
    select: {
      id: true,
      compradorNome: true,
      compradorCpf: true,
      compradorTelefone: true,
      compradorEmail: true,
      cadastroCliente: true,
      numeroProcessoInterno: true,
      numeroPropostaCaixa: true,
    },
  });

  if (!proposta) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  }

  const bytes = await gerarFormularioCadastroPdf(proposta);
  const nome =
    proposta.numeroProcessoInterno ||
    proposta.numeroPropostaCaixa ||
    proposta.id.slice(0, 8);
  const filename = `formulario-cadastro-${nome.replace(/[^\w.-]+/g, "_")}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

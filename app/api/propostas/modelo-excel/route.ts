import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { gerarModeloExcel } from "@/src/modules/propostas/excel";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const buffer = gerarModeloExcel();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo-propostas-concretiza.xlsx"',
    },
  });
}

import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { obterDocumentoParaDownload } from "@/src/modules/checklist/service";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await obterDocumentoParaDownload(id);
  if (!doc) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const buffer = await readFile(doc.absolutePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.nomeOriginal)}"`,
      "Content-Length": String(buffer.length),
    },
  });
}

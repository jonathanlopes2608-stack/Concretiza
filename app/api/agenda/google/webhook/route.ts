import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { pullGoogleIncremental } from "@/src/modules/agenda/service";

/** Google Push Notification — dispara pull incremental. */
export async function POST(req: NextRequest) {
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");
  if (!channelId) return new NextResponse(null, { status: 400 });

  if (resourceState === "sync") {
    return new NextResponse(null, { status: 200 });
  }

  const conta = await prisma.googleConta.findFirst({
    where: { channelId, ativo: true },
    select: { usuarioId: true },
  });
  if (conta) {
    try {
      await pullGoogleIncremental(conta.usuarioId);
    } catch {
      // ack mesmo com erro para não reenviar em loop
    }
  }
  return new NextResponse(null, { status: 200 });
}

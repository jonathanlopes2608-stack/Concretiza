import type { FaseProcesso } from "@prisma/client";
import { prisma } from "@/src/lib/db";

/** Calcula prazo absoluto (até a hora) a partir das horas configuradas da fase. */
export async function calcularPrazoSla(
  fase: FaseProcesso,
  from: Date = new Date(),
): Promise<Date | null> {
  const config = await prisma.slaConfig.findUnique({ where: { faseEtapa: fase } });
  if (!config || !config.ativo || config.horasPrazo <= 0) {
    return null;
  }

  const prazo = new Date(from);
  prazo.setTime(prazo.getTime() + config.horasPrazo * 60 * 60 * 1000);
  prazo.setMinutes(0, 0, 0);
  return prazo;
}

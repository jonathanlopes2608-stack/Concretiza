import { listarFila, type FilaFiltros } from "@/src/modules/propostas/repository";

export async function obterFila(filtros: FilaFiltros = {}) {
  return listarFila(filtros);
}

import Link from "next/link";
import { labelPerfil } from "@/src/lib/grupos";
import type { GrupoLista } from "@/src/modules/grupos/service";

export function GruposTable({ grupos }: { grupos: GrupoLista[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-neutral-100 text-xs uppercase tracking-wide text-neutral-600">
          <tr>
            <th className="px-4 py-3 font-medium">Grupo</th>
            <th className="px-4 py-3 font-medium">Código</th>
            <th className="px-4 py-3 font-medium">Permissões</th>
            <th className="px-4 py-3 font-medium">Usuários</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => (
            <tr key={g.id} className="border-b border-slate-100 last:border-0 hover:bg-neutral-100/60">
              <td className="px-4 py-3">
                <p className="font-medium text-brand-900">{g.nome}</p>
                {g.descricao ? (
                  <p className="text-xs text-neutral-600">{g.descricao}</p>
                ) : null}
                {g.sistema ? (
                  <p className="text-[10px] uppercase tracking-wide text-neutral-500">sistema</p>
                ) : null}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{g.codigo}</td>
              <td className="px-4 py-3">
                <span className="text-neutral-800">{g.permissoes?.length ?? 0}</span>
                <span className="text-xs text-neutral-500"> · {labelPerfil(g.role)}</span>
              </td>
              <td className="px-4 py-3">{g._count.usuarios}</td>
              <td className="px-4 py-3">
                {g.ativo ? (
                  <span className="text-green-700">Ativo</span>
                ) : (
                  <span className="text-neutral-500">Inativo</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/usuarios/grupos/${g.id}`}
                  className="text-sm text-brand-700 hover:underline"
                >
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

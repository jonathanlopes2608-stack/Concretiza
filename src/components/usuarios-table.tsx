import Link from "next/link";
import type { UsuarioLista } from "@/src/modules/usuarios/service";

export function UsuariosTable({ usuarios }: { usuarios: UsuarioLista[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-neutral-100 text-xs uppercase tracking-wide text-neutral-600">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">E-mail</th>
            <th className="px-4 py-3 font-medium">Grupo</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">2FA</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-neutral-100/60">
              <td className="px-4 py-3 font-medium text-brand-900">{u.nomeCompleto}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3">{u.grupoNome ?? "—"}</td>
              <td className="px-4 py-3">
                {u.ativo ? (
                  <span className="text-green-700">Ativo</span>
                ) : (
                  <span className="text-neutral-500">Inativo</span>
                )}
              </td>
              <td className="px-4 py-3">{u.twoFactorEnabled ? "Sim" : "Não"}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/usuarios/${u.id}`}
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

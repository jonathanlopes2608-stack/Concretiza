import type { Role } from "@prisma/client";
import { auth } from "@/src/lib/auth";
import type { PermissaoCodigo } from "@/src/lib/permissoes";
import { temAlgumaPermissao, temPermissao } from "@/src/lib/permissoes";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }
  return session;
}

export function hasRole(userRole: Role, allowed: Role[]): boolean {
  return allowed.includes(userRole);
}

export async function requireRoles(allowed: Role[]) {
  const session = await requireSession();
  if (!hasRole(session.user.role, allowed)) {
    throw new Error("Sem permissão");
  }
  return session;
}

export async function requirePermissao(codigo: PermissaoCodigo) {
  const session = await requireSession();
  const perms = session.user.permissoes ?? [];
  if (perms.length > 0) {
    if (!temPermissao(perms, codigo)) throw new Error("Sem permissão");
    return session;
  }
  // Fallback legado: ADMIN passa em tudo de gestão
  if (session.user.role === "ADMIN") return session;
  throw new Error("Sem permissão");
}

export async function requireAlgumaPermissao(codigos: PermissaoCodigo[]) {
  const session = await requireSession();
  const perms = session.user.permissoes ?? [];
  if (perms.length > 0) {
    if (!temAlgumaPermissao(perms, codigos)) throw new Error("Sem permissão");
    return session;
  }
  if (session.user.role === "ADMIN") return session;
  throw new Error("Sem permissão");
}

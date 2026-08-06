import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authenticator } from "otplib";
import type { Role } from "@prisma/client";
import { ensureAuthUrlFromAppUrl } from "@/src/lib/auth-url";
import { prisma } from "@/src/lib/db";
import { nomeCompleto } from "@/src/lib/grupos";
import {
  normalizarPermissoes,
  PERMISSOES_POR_ROLE,
  type PermissaoCodigo,
} from "@/src/lib/permissoes";
import { verifyPending2faToken } from "@/src/lib/two-factor";

ensureAuthUrlFromAppUrl();

declare module "next-auth" {
  interface User {
    role: Role;
    permissoes: PermissaoCodigo[];
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      permissoes: PermissaoCodigo[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    permissoes: PermissaoCodigo[];
  }
}

async function permissoesDoUsuario(userId: string, role: Role): Promise<PermissaoCodigo[]> {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      grupo: { select: { permissoes: true } },
    },
  });
  const fromGrupo = normalizarPermissoes(user?.grupo?.permissoes);
  if (fromGrupo.length) return fromGrupo;
  return PERMISSOES_POR_ROLE[role] ?? [];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        totp: { label: "Código 2FA", type: "text" },
        pendingToken: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.pendingToken && credentials?.totp) {
          const userId = await verifyPending2faToken(String(credentials.pendingToken));
          const user = await prisma.usuario.findUnique({ where: { id: userId } });
          if (!user || !user.ativo || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return null;
          }
          const valid = authenticator.verify({
            token: String(credentials.totp),
            secret: user.twoFactorSecret,
          });
          if (!valid) return null;
          const permissoes = await permissoesDoUsuario(user.id, user.role);
          return {
            id: user.id,
            email: user.email,
            name: nomeCompleto(user.nome, user.sobrenome),
            role: user.role,
            permissoes,
          };
        }

        const email = credentials?.email ? String(credentials.email).toLowerCase().trim() : "";
        const password = credentials?.password ? String(credentials.password) : "";
        if (!email || !password) return null;

        const user = await prisma.usuario.findUnique({ where: { email } });
        if (!user || !user.ativo) return null;

        const ok = await compare(password, user.senhaHash);
        if (!ok) return null;

        if (user.twoFactorEnabled) return null;

        const permissoes = await permissoesDoUsuario(user.id, user.role);
        return {
          id: user.id,
          email: user.email,
          name: nomeCompleto(user.nome, user.sobrenome),
          role: user.role,
          permissoes,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.permissoes = user.permissoes ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.email = String(token.email ?? "");
      session.user.name = String(token.name ?? "");
      session.user.permissoes = token.permissoes ?? [];
      return session;
    },
  },
});

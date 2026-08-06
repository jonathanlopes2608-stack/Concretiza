"use server";

import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { AuthError } from "next-auth";
import { authenticator } from "otplib";
import { signIn, signOut, auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/db";
import {
  createPending2faToken,
  getPending2faCookieName,
} from "@/src/lib/two-factor";
import { enable2faSchema, loginSchema, totpSchema } from "@/src/modules/auth/schema";

export type ActionResult = { ok: true } | { ok: false; error: string; needs2fa?: boolean };

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user || !user.ativo) {
    return { ok: false, error: "E-mail ou senha inválidos" };
  }

  const passwordOk = await compare(parsed.data.password, user.senhaHash);
  if (!passwordOk) {
    return { ok: false, error: "E-mail ou senha inválidos" };
  }

  if (user.twoFactorEnabled) {
    const token = await createPending2faToken(user.id);
    const jar = await cookies();
    jar.set(getPending2faCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    return { ok: false, error: "2FA necessário", needs2fa: true };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
    if (result && typeof result === "object" && "error" in result && result.error) {
      return { ok: false, error: "Falha ao autenticar" };
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Falha ao autenticar" };
    }
    throw error;
  }
}

export async function verify2faAction(input: unknown): Promise<ActionResult> {
  const parsed = totpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Código inválido" };
  }

  const jar = await cookies();
  const pendingToken = jar.get(getPending2faCookieName())?.value;
  if (!pendingToken) {
    return { ok: false, error: "Sessão 2FA expirada. Faça login novamente." };
  }

  try {
    const result = await signIn("credentials", {
      pendingToken,
      totp: parsed.data.totp,
      redirect: false,
    });
    if (result && typeof result === "object" && "error" in result && result.error) {
      return { ok: false, error: "Código 2FA inválido" };
    }
    jar.delete(getPending2faCookieName());
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Código 2FA inválido" };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function prepare2faSetupAction(): Promise<
  | { ok: true; secret: string; otpauth: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Não autenticado" };

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(session.user.email, "Concretiza", secret);
  return { ok: true, secret, otpauth };
}

export async function enable2faAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Não autenticado" };

  const parsed = enable2faSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const valid = authenticator.verify({
    token: parsed.data.totp,
    secret: parsed.data.secret,
  });
  if (!valid) return { ok: false, error: "Código inválido. Tente novamente." };

  await prisma.usuario.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: parsed.data.secret,
    },
  });

  return { ok: true };
}

export async function disable2faAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Não autenticado" };

  const parsed = totpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Código inválido" };
  }

  const user = await prisma.usuario.findUnique({ where: { id: session.user.id } });
  if (!user?.twoFactorSecret) {
    return { ok: false, error: "2FA não está ativo" };
  }

  const valid = authenticator.verify({
    token: parsed.data.totp,
    secret: user.twoFactorSecret,
  });
  if (!valid) return { ok: false, error: "Código inválido" };

  await prisma.usuario.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return { ok: true };
}

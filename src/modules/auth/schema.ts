import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export const totpSchema = z.object({
  totp: z.string().regex(/^\d{6}$/, "Informe o código de 6 dígitos"),
});

export const enable2faSchema = z.object({
  totp: z.string().regex(/^\d{6}$/, "Informe o código de 6 dígitos"),
  secret: z.string().min(16),
});

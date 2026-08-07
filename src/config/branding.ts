/**
 * Branding white-label por instalação (um correspondente = um deploy).
 *
 * Preferência de override (sem rebuild de código no Docker/Railway):
 *   BRAND_NAME, BRAND_SHORT_NAME, BRAND_LOGO, BRAND_SLOGAN,
 *   BRAND_RAZAO_SOCIAL, BRAND_CNPJ, BRAND_TELEFONE, BRAND_SITE,
 *   BRAND_COLOR_900, BRAND_COLOR_700, BRAND_COLOR_500
 *
 * No client, use também NEXT_PUBLIC_BRAND_* (inlinadas no build) ou
 * passe o resultado de `getBranding()` do Server Component como props.
 *
 * Alternativa sem env: editar os defaults abaixo e redeployar.
 */

export type BrandingColors = {
  brand900: string;
  brand700: string;
  brand500: string;
  neutral600: string;
  neutral100: string;
};

export type BrandingCorrespondente = {
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  site: string;
};

export type Branding = {
  name: string;
  shortName: string;
  slogan: string;
  /** Alias legado de slogan (tagline). */
  tagline: string;
  logo: string;
  colors: BrandingColors;
  correspondente: BrandingCorrespondente;
  statusColors: Record<string, string>;
};

const DEFAULTS: Branding = {
  name: "Concretiza",
  shortName: "Concretiza",
  slogan: "Financiamentos",
  tagline: "Financiamentos",
  logo: "/branding/concretiza-logo.png",
  colors: {
    brand900: "#1E3A5F",
    brand700: "#2E6FB0",
    brand500: "#29ABE2",
    neutral600: "#58595B",
    neutral100: "#F4F6F8",
  },
  correspondente: {
    razaoSocial: "Concretiza Financiamentos",
    cnpj: "",
    telefone: "",
    site: "",
  },
  statusColors: {
    ENTRADA: "#6B7280",
    ANALISE: "#2E6FB0",
    RESTRICAO: "#EA580C",
    ENGENHARIA: "#7C3AED",
    DEBITO_FGTS: "#F59E0B",
    CONFORMIDADE: "#0284C7",
    DECISAO: "#4F46E5",
    EM_CARTORIO: "#0D9488",
    FORMALIZACAO: "#29ABE2",
    FINALIZADO: "#16A34A",
    CANCELADO: "#6B7280",
    REPROVADA: "#DC2626",
  },
};

function env(key: string): string | undefined {
  const raw =
    process.env[key] ??
    process.env[`NEXT_PUBLIC_${key}`] ??
    process.env[key.replace(/^BRAND_/, "NEXT_PUBLIC_BRAND_")];
  const v = raw?.trim();
  return v || undefined;
}

/** Resolve branding com defaults + variáveis de ambiente (runtime no server). */
export function getBranding(): Branding {
  const slogan = env("BRAND_SLOGAN") ?? env("BRAND_TAGLINE") ?? DEFAULTS.slogan;
  return {
    name: env("BRAND_NAME") ?? DEFAULTS.name,
    shortName: env("BRAND_SHORT_NAME") ?? env("BRAND_NAME") ?? DEFAULTS.shortName,
    slogan,
    tagline: slogan,
    logo: env("BRAND_LOGO") ?? DEFAULTS.logo,
    colors: {
      brand900: env("BRAND_COLOR_900") ?? DEFAULTS.colors.brand900,
      brand700: env("BRAND_COLOR_700") ?? DEFAULTS.colors.brand700,
      brand500: env("BRAND_COLOR_500") ?? DEFAULTS.colors.brand500,
      neutral600: DEFAULTS.colors.neutral600,
      neutral100: DEFAULTS.colors.neutral100,
    },
    correspondente: {
      razaoSocial:
        env("BRAND_RAZAO_SOCIAL") ?? DEFAULTS.correspondente.razaoSocial,
      cnpj: env("BRAND_CNPJ") ?? DEFAULTS.correspondente.cnpj,
      telefone: env("BRAND_TELEFONE") ?? DEFAULTS.correspondente.telefone,
      site: env("BRAND_SITE") ?? DEFAULTS.correspondente.site,
    },
    statusColors: DEFAULTS.statusColors,
  };
}

/** Snapshot estático (defaults + env no momento do import). Preferir `getBranding()`. */
export const branding: Branding = getBranding();

/** CSS custom properties para injetar no `<html>` / layout. */
export function brandingCssVars(b: Branding = getBranding()): Record<string, string> {
  return {
    "--brand-900": b.colors.brand900,
    "--brand-700": b.colors.brand700,
    "--brand-500": b.colors.brand500,
    "--neutral-600": b.colors.neutral600,
    "--neutral-100": b.colors.neutral100,
    "--foreground": b.colors.brand900,
    "--background": b.colors.neutral100,
  };
}

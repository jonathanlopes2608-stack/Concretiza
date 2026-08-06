export const branding = {
  name: "Concretiza",
  tagline: "Financiamentos",
  logo: "/branding/concretiza-logo.png",
  colors: {
    brand900: "#1E3A5F",
    brand700: "#2E6FB0",
    brand500: "#29ABE2",
    neutral600: "#58595B",
    neutral100: "#F4F6F8",
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
} as const;

export type Branding = typeof branding;

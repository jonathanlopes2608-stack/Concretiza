---
name: concretiza-ui
description: >-
  Identidade visual e diretrizes de UI do sistema de conformidade da Concretiza:
  logo, paleta de cores, tema com Tailwind e branding parametrizável (tokens em
  config). Use ao criar telas, componentes, layout, tema, dashboard ou qualquer
  elemento visual deste projeto.
---

# UI & Branding — Sistema Concretiza

## Princípio: branding parametrizável
O MVP é para a **Concretiza**, mas cores e logo devem vir de **tokens de tema**
(`src/config/branding.ts` + CSS variables), nunca hardcoded espalhados. Trocar
de marca = trocar o arquivo de config, sem mexer nos componentes.

## Logo
- Arquivo: `Concretiza_logo.png` (mover para `public/branding/` no app).
- Conceito: "C" com barras crescentes (gráfico) em gradiente azul + wordmark
  "CONCRETIZA / FINANCIAMENTOS".
- Usar em fundo claro. Prever versão reduzida/ícone para a barra lateral.

## Paleta (extraída da logo)
| Token | Hex | Uso |
|-------|-----|-----|
| `brand.900` (navy) | `#1E3A5F` | textos fortes, header, sidebar |
| `brand.700` (azul) | `#2E6FB0` | primária (botões, links ativos) |
| `brand.500` (azul claro) | `#29ABE2` | destaques, gradientes, hover |
| `neutral.600` (cinza) | `#58595B` | texto secundário (wordmark) |
| `neutral.100` | `#F4F6F8` | fundo de apoio |

Gradiente de marca: `brand.900 → brand.500`.

### Cores de status (fila de conformidade)
Mapear aos status do domínio:
- `ENTRADA`: cinza/neutro
- `EM_ANALISE`: `brand.700` (azul)
- `PENDENCIA`: âmbar `#F59E0B`
- `CONFORME`: verde `#16A34A`
- `ENVIADA_CAIXA`: `brand.500`
- `REPROVADA`: vermelho `#DC2626`

## Diretrizes
- Stack visual: **Tailwind CSS**; expor a paleta em `tailwind.config` via CSS
  variables para permitir troca de tema em runtime.
- UI limpa e moderna, foco em produtividade (é ferramenta de trabalho interno).
- Densidade de informação alta em telas de fila/dashboard, com hierarquia clara.
- Componentes reutilizáveis (badges de status, cards de proposta, tabela de
  fila, calendário de agenda) — evitar duplicação.
- Acessibilidade: contraste adequado, foco visível, navegação por teclado.
- Responsivo (web em nuvem; uso principal em desktop, mas não quebrar no mobile).

## Estrutura sugerida de tema
```ts
// src/config/branding.ts
export const branding = {
  name: "Concretiza",
  logo: "/branding/concretiza-logo.png",
  colors: {
    brand900: "#1E3A5F",
    brand700: "#2E6FB0",
    brand500: "#29ABE2",
    neutral600: "#58595B",
  },
};
```
Componentes consomem CSS variables geradas a partir desse config.

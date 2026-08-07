# Memória do Projeto — Concretiza (Fila de Conformidade)

> Fonte única de verdade sobre escopo, decisões e progresso. Consultar antes de
> cada tarefa; atualizar após mudanças relevantes. (skill: `concretiza-memoria`)

_Última atualização: 2026-08-07 (manual operacional v1.1 — nav horizontal + abas)_

## Objetivo e problema
Sistema web para controlar a **fila de produção** e o **pipeline operacional**
de financiamento imobiliário (**correspondente / agente Caixa**). Centraliza
fases do processo (análise, engenharia, conformidade, cartório…), bloqueios
(“de quem depende / o que falta”), priorização, distribuição entre analistas,
SLA e produtividade. Substitui o processo atual em **planilha, e-mail e
sistema Caixa**. MVP ampliado para a **Concretiza**.

## Usuários e papéis (RBAC)
- `ADMIN` — configuração, usuários, branding, tipos de dependência.
- `COORDENADOR` — distribui a fila, dashboards, reatribuição, SLA, força avanço.
- `ANALISTA` — trabalha suas propostas, checklist, bloqueios, agenda.
- `VISUALIZACAO` — somente leitura.

## Escopo do MVP
- Entrada de propostas: **manual + importação Excel** (API de parceiro prevista).
- Pipeline com **fases operacionais** (planilha + POP CCA).
- **Bloqueios** tipados por dependência (Cliente, Despachante, EN QA, Engenharia,
  Banco/Agência, Cartório + CRUD de novos tipos).
- Fila com fase, “parado em”, analista, despachante, SLA.
- Checklist documental (fase Conformidade) + anexos + OCR validade/CPF.
- **Dashboard** de produtividade (funil, aging, travados, por analista).
- Histórico / auditoria por proposta.
- **Agenda** (`/agenda`): compromissos + **Google Calendar** (OAuth por usuário,
  Gmail pessoal no MVP), sync bidirecional, compartilhamento de visibilidade
  só no Concretiza.
- Login + papéis (RBAC) + **2FA TOTP**.
- **Shell UI**: branding white-label por instalação; **teste** de nav horizontal
  (barra superior módulos) no lugar da sidebar; abas só no detalhe de processo;
  última rota/filtros por módulo em `sessionStorage`.

### Fases do processo
`ENTRADA → ANALISE → (RESTRICAO) → ENGENHARIA → (DEBITO_FGTS) → CONFORMIDADE → DECISAO → EM_CARTORIO / FORMALIZACAO → FINALIZADO`
(+ `CANCELADO` / `REPROVADA`). Toda transição gera histórico.

Bloqueios respondem **por que parou** e **de quem depende**, independentes da fase.

## Fora de escopo (perguntar antes de implementar)
- Contas Google Workspace corporativas / agendas compartilhadas da empresa
  (hoje cada usuário conecta a própria conta Gmail).
- **Multi-tenant no mesmo banco** (várias empresas na mesma instância).
  Modelo escolhido: **opção B** — cada correspondente = **instalação/deploy
  próprio**, com branding (logo + dados da marca) via config/env.
- Assinatura digital.
- Integração direta com sistemas da Caixa (SIOPI / Isolve / Caixa Aqui).
- Login para despachante/cliente (dependências são externas no MVP).

## Decisões de arquitetura
- **Stack**: Next.js (App Router) + TypeScript + React + Tailwind.
- **Banco**: PostgreSQL + Prisma 6.
- **Auth**: Auth.js (NextAuth v5) — e-mail/senha + **2FA TOTP**; sessão JWT; RBAC no servidor.
- **Agenda Google**: OAuth separado do login; tokens em `GoogleConta` (criptografados);
  sync pull (syncToken) + push em CRUD; webhook opcional se `APP_URL` HTTPS.
- **Arquivos**: disco local (`uploads/`, volume Docker); sem S3 no MVP.
- **IA conformidade**: interface `ConformidadeEngine` + stub/OCR em `src/lib/conformidade-engine.ts`.
- **Deploy**: **Railway** para validação externa do MVP (HTTPS sem domínio);
  destino pós-MVP = **VPS** com Docker (`docker-compose.prod.yml`). Guia:
  `docs/DEPLOY.md`.
- **Branding**: white-label por instalação — `src/config/branding.ts` +
  `getBranding()` (env `BRAND_*`) + CSS variables no root layout.
  Campos: nome, shortName, logo, slogan, cores, dados do correspondente
  (razão social, CNPJ, telefone, site).
- **Abas**: aba fixa **Fila** (primeira, sem X, `/fila`) + abas de processo
  `/propostas/[id]` em `localStorage` (`process-tabs-store` + `ProcessTabs`).
  Tabstrip só em `/fila` e `/propostas/...`; oculta em Dashboard/Agenda/etc.
  (abas persistem e reaparecem ao voltar à Fila).
- **Nav (teste UX)**: barra superior horizontal (`ModuleNav`) no lugar da sidebar;
  última rota por módulo + query da fila em `sessionStorage` (`nav-module-store`).
- Pipeline: `src/modules/pipeline`, bloqueios: `src/modules/bloqueios`, dashboard: `src/modules/dashboard`, agenda: `src/modules/agenda`.

## Progresso
- [x] Escopo inicial + skills + bootstrap + auth/2FA.
- [x] CRUD propostas + import Excel + checklist + OCR validade/CPF.
- [x] **Pipeline `FaseProcesso`** + migração de `StatusProposta` + SLA por fase.
- [x] Transição de fase (RBAC) + atribuição de analista.
- [x] **Bloqueios** + tipos de dependência configuráveis + link checklist→bloqueio.
- [x] Fila com “Parado em” + filtros (fase, dependência, travados, SLA).
- [x] **Dashboard** de produtividade + export CSV da fila.
- [x] Campos `numeroProcessoInterno` + `despachanteNome`.
- [x] Manual operacional Word (`docs/MANUAL_OPERACIONAL.docx`) + prints em `docs/manual/`.
- [x] **Gestão de usuários** (ADMIN): e-mail, nome, sobrenome, grupo; tela `/usuarios`.
- [x] **Gestão de grupos** (ADMIN): CRUD em `/usuarios/grupos`; perfil de acesso (RBAC) por grupo.
- [x] Permissões granulares (telas/ações) por checkbox no grupo; menu e sessão usam `permissoes`.
- [x] **Agenda UI** + Google Calendar (OAuth pessoal, sync bidirecional, compartilhamento).
- [x] **Linha do tempo** visual no detalhe do processo (botão ao lado do nome; dados do histórico).
- [x] Prep **deploy web**: `docker-compose.prod.yml`, seed no container (`tsx`+`prisma` em deps),
  `docs/DEPLOY.md` (Railway agora → VPS depois).
- [x] **Formulário cadastro de clientes (Caixa)**: campos do PDF em `Proposta.cadastroCliente`
  (JSON) + seções no form; export `GET /api/propostas/[id]/formulario.pdf` (pdf-lib);
  template de referência em `docs/templates/` e `public/templates/`.
- [x] **UI shell**: branding expandido + logo no header; **teste** nav horizontal
  (ícone+label CAPS, ativo invertido); abas de processos; persistência de rota/filtros.
- [ ] Importação direta da planilha CONTROLE ORÇA (opcional).
- [ ] Deploy efetivo no Railway + contas dos validadores (operacional).

## Documentação operacional
- Manual (analistas/coordenadores): [`docs/MANUAL_OPERACIONAL.docx`](MANUAL_OPERACIONAL.docx) (v1.1 — menu horizontal + seção de abas)
- Prints das telas: `docs/manual/` (inclui `11-abas-processos.png`)
- Regenerar Word: `python scripts/gerar-manual-operacional.py`
- Recapturar prints (app em 3047): `node scripts/capturar-prints-manual.mjs` (requer `playwright` + Chromium)

## Acesso local
- App: **http://localhost:3047**
- Postgres host: **localhost:5437** (Docker ou Postgres embutido em `.data/pg-5437`)
- Atalhos: `inicia.bat` / `reinicia.bat`
- Login seed: `admin@concretiza.local` / `Admin@123`
- **Dados demo** (dashboard/apresentação): `npm run db:seed-demo`
  — 20 propostas/clientes (`DEMO/001`…), 15 ativos em fases distintas,
  bloqueios em CLIENTE/DESPACHANTE/ANALISTA/ENGENHARIA/BANCO_AGENCIA/CARTORIO,
  3 analistas + coordenador (`*@concretiza.local` / `Admin@123`). Idempotente.

## Diretrizes operacionais
- **Reinício obrigatório (padrão)**: após mudanças em código/config que afetem o
  app (incluindo telas/rotas novas), **parar e subir de novo** — não confiar só
  no hot reload. A tarefa só termina com o sistema rodando.
  - Rule: `.cursor/rules/reinicio-obrigatorio.mdc` (`alwaysApply`)
  - Skill: `concretiza-arquitetura` (seção Execução local)
  - Atalhos: `reinicia.bat` / `inicia.bat`
- Sem Docker: o `inicia.bat` sobe `scripts/start-embedded-db.mjs` na porta 5437.

## Próximos passos
1. Seguir `docs/DEPLOY.md`: push GitHub → Railway + Postgres + seed + usuários externos.
2. Webhook Google Push em produção (HTTPS) + registro de channel (quando ligar agenda).
3. Import opcional da planilha de controle ORÇA/engenharia.
4. Gates mais finos por fase e papéis de visualização EN QA.
5. Usar campos do correspondente no PDF do formulário (quando necessário).

## Log de decisões
- 2026-07-24 — Agenda é módulo interno (sem integração externa).
- 2026-07-24 — Stack: Next.js + TS + PostgreSQL + Prisma, Docker na VPS.
- 2026-07-24 — Single-tenant com branding parametrizável.
- 2026-07-24 — Skills e memória do projeto criadas em `.cursor/skills/` e `docs/`.
- 2026-07-24 — Auth: e-mail/senha + 2FA TOTP (Auth.js).
- 2026-07-24 — Checklist fixo via seed; anexos + schema de validação automática.
- 2026-07-24 — SLA por horas de etapa → prazo absoluto (data/hora).
- 2026-07-24 — Bootstrap + schema + auth + login/fila implementados; build OK.
- 2026-07-24 — Portas dedicadas: app **3047**, Postgres host **5437**; criado `inicia.bat`.
- 2026-07-24 — Diretriz: mudanças que param o sistema devem ser seguidas de
  religada imediata (`reinicia.bat` criado).
- 2026-07-24 — CRUD proposta (manual) + import Excel; checklist e SLA na criação.
- 2026-07-24 — Diretriz de reinício reforçada: rule alwaysApply
  `.cursor/rules/reinicio-obrigatorio.mdc` + skill arquitetura + memória.
- 2026-07-24 — Checklist UI + upload local; regra VALIDADE_IDENTIDADE (PDF texto
  ou data informada pelo analista).
- 2026-07-24 — `ChecklistResposta.validadeInformada` persistida (não some ao
  sair da tela); botão "Salvar validade".
- 2026-07-24 — Camada 1 OCR: Tesseract.js (pt) em imagens JPG/PNG/WEBP para
  extrair validade em prints/scanners.
- 2026-07-24 — Heurística CNH: distinguir 4a EMISSÃO vs 4b VALIDADE; OCR antes
  de validade antiga gravada (evita reaproveitar emissão errada).
- 2026-07-24 — Validação APROVADO → item OK (bloqueado); REPROVADO → item
  REPROVADO; sincroniza mensagem; só admin/coordenador reabre.
- 2026-07-24 — Auditoria CPF: OCR/PDF extrai CPF (campo 4d CNH) e compara com
  `compradorCpf` (ou CPF do vendedor se 11 dígitos); regra `CPF_DOCUMENTO`
  junto com validade; divergência → REPROVADO.
- 2026-08-01 — Escopo ampliado: pipeline operacional completo (não só
  conformidade documental). `StatusProposta` substituído por `FaseProcesso`.
- 2026-08-01 — Bloqueios com `TipoDependencia` configurável; dashboard de
  produtividade; campos processo interno + despachante.
- 2026-08-01 — Manual operacional em Word (`docs/MANUAL_OPERACIONAL.docx`) com
  mapeamento Excel/POP e prints reais das telas.
- 2026-08-04 — Seed demo (`scripts/seed-demo-dados.mjs` / `npm run db:seed-demo`)
  para compor dashboard: 20 clientes, 15 processos ativos, dependências variadas.
- 2026-08-04 — Fila: ordenação asc/desc por coluna via query (`ordenar` + `dir`).
- 2026-08-04 — Gestão de usuários: `sobrenome` + CRUD ADMIN; grupos = Role com
  descrição de acessos (`src/lib/grupos.ts`); rotas `/usuarios`.
- 2026-08-04 — `GrupoUsuario` gerenciável (`/usuarios/grupos`); usuário aponta
  para grupo; `role` sincronizado do perfil do grupo (RBAC).
- 2026-08-04 — Permissões por checkbox (telas + ações) em `GrupoUsuario.permissoes`;
  role derivado; sessão/nav filtram por permissão.
- 2026-08-04 — Agenda + Google Calendar: OAuth pessoal, sync bidirecional,
  `AgendaCompartilhamento` (visibilidade só no Concretiza).
- 2026-08-06 — Linha do tempo visual no detalhe (`LinhaDoTempoTrigger`): eventos
  agrupados por dia a partir de `HistoricoProposta`; botão ao lado do nome.
- 2026-08-06 — Deploy validação: Railway (agora) → VPS Docker (depois);
  `docker-compose.prod.yml`, guia `docs/DEPLOY.md`; agenda Google opcional no 1º ar.
- 2026-08-06 — `docs/DEPLOY.md` reescrito com passo a passo detalhado (Railway,
  branch `master`, variáveis, Shell/seed, troubleshooting) para deploy por iniciante.
- 2026-08-06 — Fix build Railway: `Map<string, string>` em `usuario-form` (códigos
  de permissão vindos do grupo são `string[]`, não `PermissaoCodigo`).
- 2026-08-06 — Fix Docker build Railway: `ENV DATABASE_URL` placeholder no stage
  `builder` antes de `prisma generate` (var real só em runtime no serviço app).
- 2026-08-06 — Login Railway “Entrar não faz nada”: Auth.js sem `AUTH_URL` usava
  host `0.0.0.0:8080` (`HOSTNAME` do Dockerfile). Fix: `ensureAuthUrlFromAppUrl`
  (+ feedback de erro no form); documentar `AUTH_URL` = `APP_URL` com `https://`.
- 2026-08-06 — Mesmo sintoma pós-AUTH_URL: middleware `getToken` sem `secureCookie`
  lia cookie errado (`authjs…` vs `__Secure-authjs…`); login gravava sessão e a
  fila bounceava de volta ao `/login`. Fix: `secureCookie` no middleware + check
  de sessão após `signIn` no `loginAction`.
- 2026-08-07 — Check pós-`signIn` no `loginAction` era prematuro (race): cookie
  já gravado, mas `auth()` na mesma request falhava → mensagem falsa
  “sessão não ficou ativa”; F5 entrava. Fix: remover re-leitura; redirect
  `/fila` e middleware (`secureCookie`) valida no próximo request.
- 2026-08-06 — Cadastro de clientes alinhado ao formulário Caixa (PDF): campo JSON
  `cadastroCliente` + UI em seções; PDF gerado com pdf-lib (layout recriado —
  PDF original não era fillable e já vinha preenchido); data de geração em
  America/Sao_Paulo; botão no detalhe/edição.
- 2026-08-06 — Multi-correspondente = **opção B** (deploy por correspondente),
  não multi-tenant no mesmo DB. Branding via `BRAND_*` / `branding.ts`.
- 2026-08-06 — Abas = **opção A**: só detalhe de processo; fila/dashboard
  navegação normal. Sidebar recolhível + logo ~2x com nome abaixo.
- 2026-08-06 — Aba fixa **Fila** como primeira no tabstrip (sempre aberta, sem X).
- 2026-08-06 — Nome/grupo/Sair só no header (canto superior direito); removido
  do rodapé da sidebar.
- 2026-08-06 — Teste de usabilidade: nav horizontal (brand.900, ícone+CAPS,
  ativo branco) no lugar da sidebar; `sessionStorage` guarda última rota por
  módulo e query da fila ao trocar de menu.
- 2026-08-06 — Tabstrip (Fila + processos) só em `/fila` e `/propostas/...`;
  oculta em Dashboard/Agenda/Usuários/Config/Conta; abas persistem em localStorage.
- 2026-08-06 — Header/nav superior ~2× (logo, ícones, labels, usuário/Sair,
  paddings) em `app-shell` / `module-nav` / ícones; scroll horizontal no mobile.
- 2026-08-06 — Itens do menu horizontal (FILA…CONTA) ~20% menores (padding,
  ícones 35px, labels 14/16px, min-width) para caber sem scroll no desktop;
  `overflow-x-auto` só abaixo de `md`.
- 2026-08-06 — Tabstrip da Fila ~1.5× (padding, tipografia 18px, ícone X 15px)
  em `process-tabs.tsx`.
- 2026-08-06 — Header: bloco do usuário com largura fixa + fonte menor +
  `truncate`; nav (módulos+CONTA) em `flex-1 min-w-0` para não sobrepor CONFIG/CONTA.
- 2026-08-06 — Header: exibe só o primeiro nome (primeiro token de
  `session.user.name`); grupo/papel permanece abaixo; tooltip com nome completo.
- 2026-08-07 — Manual operacional v1.1: prints atualizados (UI atual), texto de
  navegação horizontal (sem sidebar), seção de vantagens do sistema de abas;
  script `capturar-prints-manual.mjs` + regeneração do docx.

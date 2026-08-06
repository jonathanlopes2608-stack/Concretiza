# Concretiza — Fila de Conformidade

Sistema web de fila de produção de conformidade (correspondente / agente Caixa).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma
- Auth.js (e-mail/senha + 2FA TOTP)
- Docker Compose (app + banco)

## Endereço local (portas dedicadas)

| Serviço | Endereço | Motivo |
|---------|----------|--------|
| App | **http://localhost:3047** | Evita conflito com outros Next.js na `:3000` |
| Postgres | `localhost:5437` | Evita conflito com outros Postgres na `:5432` |

## Setup rápido (Windows)

Dê dois cliques em `inicia.bat` (ou rode no terminal). Ele sobe o banco, aplica migrate/seed e abre o navegador.

Para **parar e subir de novo** após mudanças: use `reinicia.bat`.

**Padrão do agente**: após alterações de código/UI/config, reiniciar sempre (ver `.cursor/rules/reinicio-obrigatorio.mdc`). Não depender só do hot reload.

Login seed: `admin@concretiza.local` / `Admin@123`. Ative o 2FA em **Segurança** após o primeiro login.

### Agenda + Google Calendar
Copie as variáveis `GOOGLE_*` e `TOKEN_ENCRYPTION_KEY` de `.env.example` para o `.env`.
No Google Cloud Console, crie um OAuth Client (Web) com redirect
`http://localhost:3047/api/agenda/google/callback`. Em **Agenda**, cada usuário
conecta a própria conta Gmail e pode compartilhar a visibilidade no Concretiza.

## Setup manual

1. Copie `.env.example` para `.env` e ajuste `AUTH_SECRET` (e opcionalmente `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
2. Suba o Postgres:

```bash
docker compose up -d db
```

3. Aplique migrations e seed:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
```

4. Rode o app:

```bash
npm run dev
```

## Deploy (validação web)

Para colocar o sistema na internet (validadores externos, HTTPS sem domínio próprio), siga o **guia detalhado passo a passo** em [`docs/DEPLOY.md`](docs/DEPLOY.md): conta Railway, branch `master` no GitHub, PostgreSQL, variáveis de ambiente, domínio `*.up.railway.app`, seed e criação de usuários. Comece pela **Parte A — Railway**; a Parte B cobre VPS depois do MVP.

Resumo rápido em VPS:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed.ts
```

Local com Compose (dev):

```bash
docker compose up -d --build
```

O container da app aplica `prisma migrate deploy` na subida. Seed admin/demo é **manual** (ver `DEPLOY.md`).

## Estrutura

- `app/` — rotas e páginas
- `src/modules/` — domínio (auth, propostas, fila)
- `src/lib/` — db, auth, rbac, SLA, engine de conformidade (stub)
- `prisma/` — schema, migrations, seed
- `docs/MEMORIA_PROJETO.md` — memória viva do projeto

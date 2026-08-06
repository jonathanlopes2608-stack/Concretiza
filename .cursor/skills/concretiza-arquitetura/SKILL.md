---
name: concretiza-arquitetura
description: >-
  Stack, estrutura de repositório, convenções de código e padrões de
  deploy do sistema de conformidade da Concretiza (Next.js + TypeScript +
  PostgreSQL + Prisma, Docker na VPS). Use ao criar/organizar arquivos, definir
  camadas, modelar o banco, escrever endpoints/serviços, configurar autenticação
  ou preparar deploy/ambientes deste projeto.
---

# Arquitetura & Padrões — Sistema Concretiza

## Stack oficial
- **App**: Next.js (App Router) + TypeScript.
- **UI**: React + Tailwind CSS (ver skill `concretiza-ui`).
- **Banco**: PostgreSQL.
- **ORM**: Prisma.
- **Auth**: sessão com RBAC (ver papéis na skill `concretiza-dominio`).
- **Deploy**: Docker + docker-compose na **VPS (nuvem)**.
- **Ambientes**: `dev`, `test`, `prod` — todo código deve considerar os três.

> Ao adicionar dependências, use o gerenciador (npm) para pegar a versão atual.
> Não invente versões.

## Estrutura de repositório (alvo)
```
/app                 # rotas Next.js (App Router) + páginas/layouts
  /api               # route handlers (endpoints)
/src
  /modules           # domínio por feature (propostas, fila, agenda, auth...)
    /<feature>
      service.ts     # regras de negócio
      repository.ts  # acesso a dados (via Prisma)
      schema.ts      # validação (zod)
      types.ts
  /components        # componentes React reutilizáveis
  /lib               # infra compartilhada (db, auth, config, logger)
  /config            # branding/tema parametrizável
/prisma
  schema.prisma
  /migrations
/docs                # inclui MEMORIA_PROJETO.md
```

## Convenções (seguir as regras do usuário)
- **Simplicidade primeiro**; evitar duplicação — reaproveitar código existente
  antes de criar algo novo.
- **Arquivos ≤ 200–300 linhas**; ao ultrapassar, refatorar em arquivos menores.
- **Funções curtas e focadas**; quebrar funções longas.
- Separar camadas: rota → service → repository. Nada de SQL/Prisma nas rotas.
- Validação de entrada com **zod** em `schema.ts` de cada feature.
- Sem dados simulados em dev/prod (mock só em testes).
- Não sobrescrever `.env` — sempre perguntar/confirmar antes.
- Ao corrigir bug, não introduzir novo padrão sem esgotar o existente; se
  substituir, remover o código antigo (sem lógica duplicada).

## Banco de dados
- Modelagem central: `Proposta`, `Usuario`, `Analista`, `ChecklistItem`,
  `Pendencia`, `HistoricoProposta`, `Compromisso` (agenda), `SLA`.
- Enum de status igual ao definido na skill `concretiza-dominio`.
- Sempre gerar **migration** ao alterar `schema.prisma`.
- Toda mudança de status grava linha em `HistoricoProposta` (auditoria).

## Segurança
- RBAC verificado no servidor (nunca confiar só no front).
- Senhas com hash forte; segredos só em variáveis de ambiente.
- Registrar auditoria de ações sensíveis (reatribuição, mudança de status).

## Deploy (VPS)
- `Dockerfile` para o app + `docker-compose.yml` (app + PostgreSQL).
- Variáveis via `.env` (não versionar valores reais).
- Migrations aplicadas no start do container de app.

## Execução local (portas dedicadas)
- App: `http://localhost:3047` · Postgres host: `localhost:5437`.
- Atalhos: `inicia.bat` (sobe tudo) e `reinicia.bat` (para e sobe de novo).
- Fallback sem Docker: `node scripts/start-embedded-db.mjs` (dados em `.data/pg-5437`).

### Reinício obrigatório (padrão do projeto — sempre)
**Não depender só do hot reload.** Após qualquer alteração que afete o app
(rotas, páginas, componentes de tela, middleware, auth, `.env`, dependências,
Prisma/migrations, Docker/config), **parar a 3047 e subir de novo** antes de
encerrar a tarefa. A tarefa só termina com o sistema rodando e a URL informada.

Na dúvida se precisa reiniciar: **reinicie**.

Comando típico: usar `reinicia.bat`, ou matar o LISTENING da 3047 + garantir DB
5437 + `npm run dev`.

Rule Cursor espelhando isto: `.cursor/rules/reinicio-obrigatorio.mdc`
(`alwaysApply: true`).

## Análise pós-código
Após alterações relevantes, produzir 1–2 parágrafos sobre escalabilidade e
manutenibilidade e sugerir próximos passos (regra do usuário).

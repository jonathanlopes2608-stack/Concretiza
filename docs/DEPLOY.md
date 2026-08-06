# Deploy — Concretiza (validação web do MVP)

Guia para colocar o sistema na internet sem domínio próprio, com caminho claro
para VPS depois. Stack: Next.js + PostgreSQL + Docker.

## Estratégia

| Momento | Onde | Por quê |
|---------|------|---------|
| **Agora** (validar com externos) | [Railway](https://railway.app) (~US$5/mês) | HTTPS pronto (`*.up.railway.app`), Postgres gerenciado, deploy pelo GitHub |
| **Depois** (MVP aprovado) | VPS + `docker-compose.prod.yml` | Controle total, mesmo `Dockerfile` |

Agenda Google pode ficar **desligada** no primeiro deploy (variáveis vazias).

---

## Pré-requisitos

1. Conta no **GitHub** com o código do Concretiza (branch principal atualizada).
2. Conta no **Railway** (cartão pode ser exigido no trial/hobby).
3. Senha **forte** para o admin de produção (nunca use `Admin@123` na URL pública).

Gerar `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Parte A — Railway (recomendado agora)

### 1. Subir o código

No seu PC, confirme o remote e faça push:

```bash
git remote -v
git push -u origin HEAD
```

### 2. Criar o projeto

1. Acesse [railway.app](https://railway.app) → **New Project**.
2. **Deploy from GitHub repo** → selecione o repositório Concretiza.
3. Railway deve detectar o **`Dockerfile`** na raiz (não use só Nixpacks se o Docker estiver disponível).

### 3. Adicionar PostgreSQL

1. No mesmo projeto: **New** → **Database** → **PostgreSQL**.
2. No serviço da **app**, em **Variables**, referencie a URL do banco, por exemplo:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`  
   (o nome exato do serviço pode variar na UI do Railway).

### 4. Variáveis da aplicação

No serviço da app, defina:

| Variável | Valor |
|----------|--------|
| `AUTH_SECRET` | string longa gerada (passo pré-requisitos) |
| `AUTH_TRUST_HOST` | `true` |
| `APP_URL` | `https://SEU-SERVICO.up.railway.app` (sem `/` no final) |
| `ADMIN_EMAIL` | e-mail **seu** (admin) |
| `ADMIN_PASSWORD` | senha forte (só você) |
| `UPLOAD_DIR` | `/app/uploads` |
| `GOOGLE_CLIENT_ID` | *(vazio)* |
| `GOOGLE_CLIENT_SECRET` | *(vazio)* |
| `GOOGLE_REDIRECT_URI` | *(vazio por enquanto)* |
| `TOKEN_ENCRYPTION_KEY` | igual ao `AUTH_SECRET` ou outra chave longa |
| `TZ_AGENDA` | `America/Sao_Paulo` |

Como descobrir `APP_URL`:

1. Em **Settings** do serviço → **Networking** → **Generate Domain**.
2. Copie a URL HTTPS gerada para `APP_URL` e **redeploy**.

> O container escuta a porta que o Railway injeta (`PORT`). O `Dockerfile` já usa `HOSTNAME=0.0.0.0`.

### 5. Deploy e migrations

A cada deploy, o `CMD` do Docker roda:

```text
npx prisma migrate deploy && node server.js
```

Aguarde o status **Online**.

### 6. Seed (uma vez)

No Railway: serviço da app → **Shell** (ou one-off command):

```bash
npx tsx prisma/seed.ts
```

Isso cria checklist, SLA, tipos de dependência, grupos e o usuário admin
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

Dados de demonstração (opcional, para validação visual):

```bash
node scripts/seed-demo-dados.mjs
```

### 7. Contas para validadores externos

1. Entre com o **admin**.
2. Em **Usuários**, crie contas individuais (analista / coordenador / visualização).
3. Envie a cada pessoa: **URL do app** + **e-mail** + **senha dela**.
4. **Não** compartilhe o login admin.
5. Oriente a ativar 2FA em **Segurança** após o primeiro acesso.

### 8. Smoke test

- [ ] Login funciona em HTTPS
- [ ] Fila lista propostas (se rodou seed-demo)
- [ ] Abrir um processo e a **Linha do tempo**
- [ ] Upload de documento (pode ser efêmero no Railway sem volume — aceitável no MVP)

### Uploads no Railway

O `Dockerfile` grava em `/app/uploads`. Sem volume persistente, arquivos podem
sumir em redeploy. Para o MVP de validação isso costuma bastar; em VPS use o
volume do `docker-compose.prod.yml`.

---

## Ligar Agenda Google depois

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um OAuth Client **Web**.
2. Authorized redirect URI:
   `https://SEU-SERVICO.up.railway.app/api/agenda/google/callback`
3. Preencha no Railway:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (mesmo URI acima)
   - `TOKEN_ENCRYPTION_KEY` (obrigatório se ainda vazio)
4. Redeploy. Cada usuário conecta a própria conta em **Integrações**.

---

## Parte B — Migrar para VPS (depois do MVP)

Mesma imagem Docker; Postgres no próprio compose, **sem** publicar a porta do banco.

### 1. Servidor

- VPS com Docker + Docker Compose (Hetzner / DigitalOcean / similar).
- Firewall: liberar só `22` (SSH) e `80`/`443` (ou a porta do app se ainda sem proxy).

### 2. Código e env

```bash
git clone <seu-repo> concretiza
cd concretiza
cp .env.example .env
# Edite .env — ver bloco "VPS" no .env.example
```

Obrigatório em produção:

- `AUTH_SECRET`
- `APP_URL` (HTTPS do domínio ou, temporariamente, URL que os validadores usam)
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (forte)

### 3. Subir

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed.ts
# opcional:
docker compose -f docker-compose.prod.yml exec app node scripts/seed-demo-dados.mjs
```

### 4. HTTPS e domínio (quando tiver)

Coloque Caddy ou Nginx na frente do container (`APP_PORT`), com certificado Let's Encrypt.
Atualize `APP_URL` e o redirect do Google OAuth.

### 5. Dados do Railway → VPS

1. Dump no Railway: `pg_dump` da database.
2. Restore no Postgres da VPS.
3. Copiar pasta `uploads` se ainda precisar dos arquivos.

---

## Checklist de segurança (validadores externos)

- [ ] Senha admin forte e só com você
- [ ] Sem `Admin@123` / e-mails `*.concretiza.local` para externos
- [ ] Contas individuais por validador
- [ ] Aviso: ambiente MVP, dados podem ser resetados
- [ ] 2FA recomendado após o 1º login

---

## Referências no repositório

- [`Dockerfile`](../Dockerfile) — build standalone + migrate no start
- [`docker-compose.yml`](../docker-compose.yml) — local / desenvolvimento
- [`docker-compose.prod.yml`](../docker-compose.prod.yml) — VPS
- [`.env.example`](../.env.example) — variáveis local e produção
- `npm run db:seed` / `npm run db:seed-demo` — bootstrap de dados

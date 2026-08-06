# Deploy — Concretiza (validação web do MVP)

Guia passo a passo para colocar o sistema na internet **sem domínio próprio**, com HTTPS pronto. Escrito para quem nunca fez deploy antes. Stack: Next.js + PostgreSQL + Docker.

## Visão geral (leia antes de começar)

1. Você vai conectar o repositório **Concretiza** no GitHub ao **Railway**; o Railway lê o `Dockerfile` da raiz, monta a imagem e sobe o app com HTTPS automático (`*.up.railway.app`).
2. No mesmo projeto Railway você adiciona um **PostgreSQL** gerenciado e liga a URL do banco à aplicação por variáveis de ambiente (incluindo `APP_URL`, `AUTH_SECRET` e senha forte do admin).
3. Depois do primeiro deploy **Online**, você abre o **Shell** do serviço, roda o seed (dados iniciais + seu usuário admin), cria contas individuais para os validadores e testa o login na URL pública.

**Depois do MVP aprovado**, a migração para VPS usa o mesmo `Dockerfile` — veja [Parte B](#parte-b--migrar-para-vps-depois-do-mvp).

---

## Estratégia

| Momento | Onde | Por quê |
|---------|------|---------|
| **Agora** (validar com externos) | [Railway](https://railway.app) (~US$5/mês) | HTTPS pronto, Postgres gerenciado, deploy pelo GitHub |
| **Depois** (MVP aprovado) | VPS + `docker-compose.prod.yml` | Controle total, mesmo `Dockerfile` |

A **Agenda Google** pode ficar **desligada** no primeiro deploy (deixe as variáveis `GOOGLE_*` vazias).

Repositório: **https://github.com/jonathanlopes2608-stack/Concretiza** — branch **`master`** (não use `main`; ela pode estar vazia ou desatualizada).

---

## Checklist — o que ter aberto antes de começar

Marque mentalmente (ou num papel) antes de abrir o Railway:

- [ ] **Conta GitHub** logada, com o código do Concretiza já na branch **`master`** do repo acima.
- [ ] **Conta Railway** criada em [railway.app](https://railway.app) (pode pedir cartão no plano Hobby ~US$5/mês).
- [ ] **Bloco de notas** aberto para colar: `AUTH_SECRET`, URL do app e senha do admin (não use `Admin@123` na internet).
- [ ] **PowerShell** no Windows (para gerar o `AUTH_SECRET` — comando abaixo).
- [ ] Este guia (`docs/DEPLOY.md`) aberto ao lado do navegador.

### Gerar `AUTH_SECRET` (Windows — PowerShell)

Abra o PowerShell e rode:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**O que esperar:** uma linha longa só com letras e números (64 caracteres hex). Copie e guarde — você vai colar em `AUTH_SECRET` e pode reutilizar em `TOKEN_ENCRYPTION_KEY`.

> Se der erro `node não é reconhecido`, instale o [Node.js LTS](https://nodejs.org/) e tente de novo.

---

## Parte A — Railway (recomendado agora)

Siga na ordem. Cada passo tem subtítulo e o que você deve **ver na tela**.

### A.0 — Confirmar que o GitHub está atualizado (no seu PC)

No terminal, na pasta do projeto:

```powershell
cd E:\Cursor\Concretiza
git remote -v
git branch
git push -u origin master
```

**O que esperar:**

- `git remote -v` mostra `origin` apontando para `github.com/jonathanlopes2608-stack/Concretiza`.
- `git branch` mostra `* master` (asterisco na branch atual).
- `git push` termina sem erro — o Railway só consegue deployar o que está no GitHub.

Se sua branch local for outra, faça merge/commit em **`master`** antes de continuar.

---

### A.1 — Criar conta ou entrar no Railway

1. Abra **[https://railway.app](https://railway.app)** no navegador.
2. Clique em **Login** (canto superior direito).
3. Escolha **Continue with GitHub** e autorize o Railway a acessar sua conta GitHub.
4. **O que esperar:** você cai no **Dashboard** do Railway (lista de projetos, ou vazia se for a primeira vez).

---

### A.2 — Criar projeto a partir do GitHub

1. No Dashboard, clique em **New Project** (ou **+ New Project**).
2. Escolha **Deploy from GitHub repo** (ou **GitHub Repository**).
3. Se aparecer pedido de autorização, clique em **Configure GitHub App** / **Authorize** e permita acesso ao repositório **Concretiza** (pode ser “All repositories” ou só esse repo).
4. Na lista de repositórios, clique em **`jonathanlopes2608-stack/Concretiza`** (ou só **Concretiza**).

**O que esperar:** o Railway cria um **projeto** com pelo menos **um serviço** (geralmente com o nome do repo). O status pode ficar **Building** ou **Deploying** por alguns minutos.

---

### A.3 — Importante: branch `master`

O Railway costuma usar a branch **default** do GitHub. Confira:

1. Clique no **serviço da aplicação** (não no Postgres ainda — você ainda não criou).
2. Vá em **Settings** (ícone de engrenagem ou aba Settings).
3. Procure **Source** / **GitHub** / **Branch**.
4. Confirme que está **`master`**. Se estiver `main` ou outra, **altere para `master`** e salve.

**Por quê:** o desenvolvimento deste projeto usa **`master`**. A branch `main` pode não ter o código atualizado e o deploy falha ou sobe versão errada.

**O que esperar após salvar:** um novo deploy pode iniciar automaticamente (status **Building** de novo).

---

### A.4 — Como o Railway detecta o Dockerfile

Na raiz do repositório existe um arquivo **`Dockerfile`**. O Railway, ao ver esse arquivo, usa **Docker** para construir a imagem (não precisa configurar Nixpacks manualmente).

**Como conferir:**

1. No serviço da app → **Settings** → procure **Build** ou **Builder**.
2. Deve indicar **Dockerfile** ou build via Docker na raiz.

**O que o Dockerfile faz (só para você entender):**

- Instala dependências, roda `npm run build` e gera o app Next.js em modo produção.
- Na **subida** do container, executa automaticamente:  
  `npx prisma migrate deploy && node server.js`  
  Ou seja: **migrations do banco rodam sozinhas** a cada deploy; **seed não** — você roda manualmente no passo A.10.

**Se o build falhar:** veja [Se der erro — build falha](#1-build-falha-no-railway).

---

### A.5 — Adicionar PostgreSQL no mesmo projeto

1. Volte à **visão do projeto** (clique no nome do projeto no topo — breadcrumb).
2. Clique em **+ New** ou **Add Service**.
3. Escolha **Database** → **PostgreSQL** (ou **Add PostgreSQL**).

**O que esperar:** um **segundo serviço** no projeto (ícone/cartão de Postgres), separado da app. Aguarde ficar **Online** / **Active**.

---

### A.6 — Vincular `DATABASE_URL` da app ao Postgres

Você precisa que a **aplicação** use a URL de conexão do banco. Há duas formas comuns na UI do Railway (dependendo da versão da interface):

#### Opção 1 — Referência de variável (recomendada)

1. Clique no **serviço da aplicação** (não no Postgres).
2. Abra a aba **Variables** (Variáveis).
3. Clique em **+ New Variable** / **Add Variable**.
4. Nome: `DATABASE_URL`
5. Valor: use a referência ao serviço Postgres. O formato clássico é:

   ```text
   ${{Postgres.DATABASE_URL}}
   ```

   O nome **`Postgres`** deve coincidir com o **nome do serviço** PostgreSQL no seu projeto. Se você renomeou o serviço para `postgresql` ou `db`, a referência vira `${{postgresql.DATABASE_URL}}` ou `${{db.DATABASE_URL}}`.

   **Como achar o nome certo:** na aba Variables, ao adicionar variável, o Railway às vezes mostra um menu **“Add reference”** / **“Variable from service”** — selecione o serviço PostgreSQL e a variável **`DATABASE_URL`**.

6. Salve. O Railway pode pedir **Redeploy** — confirme.

#### Opção 2 — Copiar a URL manualmente

1. Clique no serviço **PostgreSQL**.
2. Aba **Variables** ou **Connect** — copie o valor de **`DATABASE_URL`** (ou **Postgres Connection URL**).
3. No serviço da **app** → **Variables** → crie `DATABASE_URL` e **cole** a URL inteira (começa com `postgresql://...`).

**O que esperar:** na app, a variável `DATABASE_URL` aparece definida (referência ou URL completa). Sem isso, o app sobe mas não conecta no banco.

---

### A.7 — Gerar domínio HTTPS e definir `APP_URL`

1. No **serviço da aplicação** → **Settings**.
2. Seção **Networking** (ou **Public Networking**).
3. Clique em **Generate Domain** (ou **Enable Public URL**).
4. O Railway gera algo como:  
   `https://concretiza-production-xxxx.up.railway.app`

**Copie essa URL inteira** (com `https://`, **sem** barra `/` no final).

5. Vá em **Variables** do serviço da app e crie ou edite:

   | Variável | Valor (exemplo — use a **sua** URL) |
   |----------|-------------------------------------|
   | `APP_URL` | `https://concretiza-production-xxxx.up.railway.app` |
   | `AUTH_URL` | `https://concretiza-production-xxxx.up.railway.app` |

   **Obrigatório:** incluir o prefixo `https://`. Valor só com o hostname (ex.: `concretiza-production.up.railway.app`) **quebra o Auth.js**.

6. **Redeploy** após alterar `APP_URL` / `AUTH_URL` (Deploy → **Redeploy** ou push no GitHub).

**Por quê:** o container escuta em `HOSTNAME=0.0.0.0`. Sem `AUTH_URL` (ou `APP_URL` válido com `https://`, que o app usa como fallback), o Auth.js monta callbacks em `https://0.0.0.0:8080/...` — o botão Entrar parece não fazer nada.

---

### A.8 — Lista completa de variáveis da aplicação

No serviço da **app** → **Variables**, configure **todas** abaixo. Exemplos são fictícios — **não** use estes valores reais em produção.

| Variável | Exemplo de valor | Obrigatório | Observação |
|----------|------------------|-------------|------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Sim | Ver passo A.6 |
| `AUTH_SECRET` | `a1b2c3d4e5f6...` (64 chars hex) | Sim | Gerado no PowerShell (início deste guia) |
| `AUTH_TRUST_HOST` | `true` | Sim | Necessário atrás do proxy HTTPS do Railway |
| `APP_URL` | `https://concretiza-production-xxxx.up.railway.app` | Sim | **Com `https://`**, sem `/` no final; passo A.7 |
| `AUTH_URL` | mesmo valor de `APP_URL` | Sim (Railway) | Auth.js; sem isso callbacks viram `https://0.0.0.0:PORT` e o login “não faz nada” |
| `ADMIN_EMAIL` | `seu.nome@gmail.com` | Sim | E-mail **seu** (admin principal) |
| `ADMIN_PASSWORD` | `MinhaSenh@Forte2026!` | Sim | **Forte**; nunca `Admin@123` na web |
| `UPLOAD_DIR` | `/app/uploads` | Sim | Caminho dentro do container |
| `GOOGLE_CLIENT_ID` | *(deixe vazio)* | Não | Agenda desligada no 1º deploy |
| `GOOGLE_CLIENT_SECRET` | *(deixe vazio)* | Não | Idem |
| `GOOGLE_REDIRECT_URI` | *(deixe vazio)* | Não | Idem |
| `TOKEN_ENCRYPTION_KEY` | mesmo valor de `AUTH_SECRET` ou outra chave longa | Recomendado | Pode repetir `AUTH_SECRET` por enquanto |
| `TZ_AGENDA` | `America/Sao_Paulo` | Sim | Fuso dos compromissos |

**Variáveis que o Railway injeta sozinho (não precisa criar):**

- `PORT` — porta interna; o `Dockerfile` já usa `HOSTNAME=0.0.0.0`.

Após salvar todas, faça **Redeploy** se o serviço não redeployar automaticamente.

---

### A.9 — Deploy, logs e o que é “sucesso”

1. Abra o serviço da app → aba **Deployments** (ou clique no deployment em andamento).
2. Clique em **View Logs** / **Build Logs** durante o build; depois **Deploy Logs** na execução.

**Sequência normal nos logs de deploy:**

```text
... prisma migrate deploy ... (migrations aplicadas)
... Ready / Listening on ... (servidor Node subiu)
```

3. Status do serviço: **Online** (verde).
4. Clique no **domínio** gerado (passo A.7) ou abra a URL no navegador.

**Sucesso neste estágio:**

- A página **carrega** (login ou redirect para login) — **sem** erro 502/503 prolongado.
- Logs **não** repetem crash em loop.
- Ainda **não** espere login funcionar plenamente até rodar o **seed** (passo A.10) — sem seed, não existe usuário admin no banco.

**Acompanhar erros:** aba **Logs** em tempo real; filtre por `Error` ou `Prisma`.

---

### A.10 — Shell: rodar seed e seed-demo (comandos exatos)

O seed cria: checklist, SLA, tipos de dependência, grupos e o **usuário admin** com `ADMIN_EMAIL` / `ADMIN_PASSWORD` que você definiu nas variáveis.

1. Serviço da **app** → aba **Shell** (terminal no container).  
   Se não houver Shell, use **Settings** → **One-off command** / **Run command** com os mesmos comandos.

2. Aguarde o prompt (usuário `nextjs`, pasta `/app`).

3. Rode o seed principal:

   ```bash
   npx tsx prisma/seed.ts
   ```

   **O que esperar:** mensagens de criação/atualização; termina **sem** stack trace vermelho. Se `ADMIN_EMAIL`/`ADMIN_PASSWORD` estiverem nas Variables, o admin é criado com esses dados.

4. *(Opcional, recomendado para validação visual)* — dados de demonstração (propostas fake na fila):

   ```bash
   node scripts/seed-demo-dados.mjs
   ```

   **O que esperar:** confirmação de propostas/clientes demo; idempotente (pode rodar de novo).

5. Feche o Shell ou saia com `exit`.

> Equivalente local: `npm run db:seed` e `npm run db:seed-demo`.

---

### A.11 — Criar usuários para validadores externos

**Não** envie o login admin para validadores. Crie uma conta por pessoa:

1. Abra `APP_URL` no navegador (HTTPS).
2. Entre com **`ADMIN_EMAIL`** e **`ADMIN_PASSWORD`** (os das Variables).
3. No menu, vá em **Usuários** (`/usuarios`).
4. **Novo usuário** para cada validador:
   - E-mail real da pessoa
   - Nome / sobrenome
   - Grupo/perfil adequado: **Analista**, **Coordenador** ou **Visualização**
   - Senha **forte** ( gere uma por pessoa; anote para enviar por canal seguro)
5. Envie a cada validador:
   - **URL:** `https://....up.railway.app`
   - **E-mail** e **senha** **dele/dela** — não a sua admin
6. Oriente: após o primeiro login, ir em **Segurança** e **ativar 2FA**.

**Regras para validadores externos:**

- ❌ Não usar `Admin@123`
- ❌ Não usar e-mails `*.concretiza.local` (só faz sentido no PC local)
- ✅ Conta individual por pessoa
- ✅ Avisar que é ambiente MVP — dados podem ser resetados

---

### A.12 — Smoke test (checklist final)

Marque na ordem:

- [ ] Abrir a URL HTTPS — página de login aparece
- [ ] Login com **admin** funciona
- [ ] Menu **Fila** abre; se rodou seed-demo, aparecem propostas
- [ ] Abrir um processo e clicar na **Linha do tempo** — eventos carregam
- [ ] **Upload** de um documento em um checklist (aceitável se sumir após redeploy — ver abaixo)
- [ ] Logout e login com **conta de validador** de teste
- [ ] *(Opcional)* Ativar 2FA no admin e confirmar que ainda entra

---

### Uploads no Railway

O app grava arquivos em `/app/uploads` **dentro** do container. Sem volume persistente no Railway, **uploads podem sumir** após redeploy ou restart. Para **validação do MVP** isso costuma ser aceitável. Na **VPS**, o `docker-compose.prod.yml` usa volume persistente (`uploads_data`).

---

## Se der erro (problemas comuns)

### 1. Build falha no Railway

**Sintomas:** deployment fica **Failed**; build logs param com erro npm/prisma/typescript.

**O que fazer:**

- Confirme branch **`master`** (passo A.3) com o código completo no GitHub.
- Abra **Build Logs** e leia a **última linha vermelha** (erro real).
- Teste local: `docker build -t concretiza-test .` na pasta do projeto — se falhar local, corrija antes do push.
- Verifique se `package-lock.json` está commitado.

---

### 2. Migrate falha (`prisma migrate deploy`)

**Sintomas:** deploy cai logo após subir; logs mostram erro Prisma / `P1001` / connection refused.

**O que fazer:**

- Confirme `DATABASE_URL` no serviço da **app** (passo A.6).
- Postgres está **Online** no mesmo projeto?
- Se copiou URL manualmente, não truncou a string? Deve começar com `postgresql://`.
- Redeploy da app **depois** do Postgres estar pronto.

---

### 3. App Online mas página 502 / Application failed to respond

**Sintomas:** domínio abre erro de gateway ou timeout.

**O que fazer:**

- Veja **Deploy Logs** — o Node chegou a `Listening`?
- Confirme que não alterou o `Dockerfile` para outra porta (deve usar `PORT` do Railway).
- Tente **Redeploy**; às vezes o primeiro deploy falha por ordem de serviços.

---

### 4. Clica em Entrar e “nada acontece”

**Sintomas:** tela de login abre; ao enviar, fica em “Entrando…” ou volta sem mensagem / sem ir para a fila.

**Causa mais comum no Railway:** `APP_URL` / `AUTH_URL` sem `https://`, ou `AUTH_URL` ausente → Auth.js usa host interno `0.0.0.0:8080`.

**Confirme em 30 segundos:** abra no navegador  
`https://SEU-SERVICO.up.railway.app/api/auth/providers`  
Se aparecer `0.0.0.0` nas URLs, a variável está errada.

**O que fazer:**

1. Variables → `APP_URL` = `https://…up.railway.app` (com `https://`, sem `/` final).
2. Variables → `AUTH_URL` = **mesmo valor** de `APP_URL`.
3. `AUTH_TRUST_HOST` = `true` e `AUTH_SECRET` definido.
4. **Redeploy**.
5. No Shell, se ainda não rodou: `npx tsx prisma/seed.ts` (sem seed, o form deve mostrar “E-mail ou senha inválidos”).
6. DevTools → Network: POST da server action / `callback/credentials` não deve redirecionar para `0.0.0.0`.

---

### 5. Loop de login (entra e volta para login)

**Sintomas:** credenciais parecem certas, mas não mantém sessão.

**O que fazer:**

- `APP_URL` e `AUTH_URL` devem ser **exatamente** a URL HTTPS pública (passo A.7), **sem** barra final.
- `AUTH_TRUST_HOST` = `true`.
- `AUTH_SECRET` definido e **não mudou** depois que usuários já logaram (mudar invalida sessões — ok no setup inicial).
- Limpe cookies do site no navegador e tente de novo.

---

### 6. `APP_URL` errado ou ainda `localhost`

**Sintomas:** redirects vão para `localhost:3047`, URL antiga, ou `https://0.0.0.0:…`.

**O que fazer:**

- Variables → corrija `APP_URL` **e** `AUTH_URL` (ambos com `https://`) → **Redeploy** obrigatório.
- Não use `http://` se o Railway só expõe `https://`.
- Não cole só o hostname sem esquema.

---

### 7. Branch `main` vazia ou deploy sem código novo

**Sintomas:** build rápido demais, app antigo, ou “repo empty”.

**O que fazer:**

- Settings → Source → branch **`master`**.
- No PC: `git push origin master`.
- No GitHub (site): abra o repo e confirme que arquivos como `Dockerfile` e `package.json` aparecem na branch **master**.

---

### 8. Seed falha ou “admin não entra”

**Sintomas:** login diz credenciais inválidas após deploy OK; ou **Entrar “não faz nada”** (volta ao login sem mensagem) mesmo com senha correta e `/api/auth/providers` já em `https://…`.

**O que fazer:**

- Rode de novo no Shell: `npx tsx prisma/seed.ts`
- Confirme que `ADMIN_EMAIL` e `ADMIN_PASSWORD` nas **Variables** são os que você está digitando (case-sensitive na senha).
- Se mudou `ADMIN_PASSWORD` **depois** do seed, rode o seed outra vez **ou** altere a senha pela tela Usuários logado como admin (se ainda tiver acesso).
- Hard refresh (Ctrl+Shift+R). Em DevTools → Network, ao clicar Entrar deve haver **POST** em `/login`. Senha errada mostra “E-mail ou senha inválidos”.
- Se a senha estiver certa e a tela só “piscar”: confira se o deploy inclui o fix de `secureCookie` no middleware (cookie `__Secure-authjs.session-token`).

---

### 9. Shell / one-off indisponível

**Sintomas:** não acha aba Shell.

**O que fazer:**

- Plano Hobby costuma incluir Shell; atualize a página.
- Use **Deploy** → menu ⋮ → **Run command** com `npx tsx prisma/seed.ts`.
- Alternativa avançada: Railway CLI local (`railway run npx tsx prisma/seed.ts`) — só se já tiver CLI configurada.

---

## Ligar Agenda Google depois

Quando quiser OAuth do Calendar em produção:

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials** → **Create OAuth client ID** → tipo **Web application**.
2. **Authorized redirect URI** (substitua pela sua URL real):

   ```text
   https://SEU-SERVICO.up.railway.app/api/agenda/google/callback
   ```

3. No Railway (Variables da app):

   | Variável | Valor |
   |----------|--------|
   | `GOOGLE_CLIENT_ID` | Client ID do Google |
   | `GOOGLE_CLIENT_SECRET` | Client Secret |
   | `GOOGLE_REDIRECT_URI` | Mesmo URI acima |
   | `TOKEN_ENCRYPTION_KEY` | Chave longa (pode ser igual a `AUTH_SECRET`) |

4. **Redeploy**. Cada usuário conecta a **própria** conta Gmail em **Integrações** / **Agenda**.

---

## Parte B — Migrar para VPS (depois do MVP)

Mesma imagem Docker; Postgres no compose, **sem** expor a porta do banco na internet.

### B.1 — Servidor

- VPS com **Docker** + **Docker Compose** (Hetzner, DigitalOcean, etc.).
- Firewall: liberar só **22** (SSH) e **80/443** (ou a porta do app se ainda sem proxy).

### B.2 — Código e `.env`

```bash
git clone https://github.com/jonathanlopes2608-stack/Concretiza.git concretiza
cd concretiza
git checkout master
cp .env.example .env
# Edite .env — bloco "VPS" no .env.example
```

Obrigatório em produção:

- `AUTH_SECRET`, `APP_URL` (HTTPS)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (forte)

### B.3 — Subir

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed.ts
# opcional:
docker compose -f docker-compose.prod.yml exec app node scripts/seed-demo-dados.mjs
```

### B.4 — HTTPS e domínio (quando tiver)

Coloque **Caddy** ou **Nginx** na frente do container (`APP_PORT` padrão 3047 no host). Certificado Let's Encrypt. Atualize `APP_URL` e o redirect OAuth do Google.

### B.5 — Dados Railway → VPS

1. Dump no Railway: `pg_dump` da database.
2. Restore no Postgres da VPS.
3. Copiar pasta `uploads` se precisar dos arquivos.

---

## Checklist de segurança (validadores externos)

- [ ] Senha admin forte — só com você
- [ ] Sem `Admin@123` / e-mails `*.concretiza.local` para externos
- [ ] Conta individual por validador
- [ ] Aviso: ambiente MVP, dados podem ser resetados
- [ ] 2FA recomendado após o 1º login

---

## Referências no repositório

- [`Dockerfile`](../Dockerfile) — build standalone + `migrate deploy` no start
- [`docker-compose.yml`](../docker-compose.yml) — local / desenvolvimento
- [`docker-compose.prod.yml`](../docker-compose.prod.yml) — VPS
- [`.env.example`](../.env.example) — variáveis local e produção
- `npm run db:seed` / `npm run db:seed-demo` — bootstrap de dados (local)

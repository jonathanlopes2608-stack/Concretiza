---
name: concretiza-dominio
description: >-
  Domínio de negócio do sistema de fila de produção de conformidade de
  financiamento imobiliário da Concretiza (correspondente/agente Caixa). Cobre o
  glossário, o ciclo de vida da proposta, status, papéis de usuário, SLA e o
  módulo de agenda. Use sempre que trabalhar em regras de negócio, modelagem de
  dados, status de propostas, checklist documental, distribuição de fila,
  agendas ou terminologia de conformidade deste projeto.
---

# Domínio — Conformidade de Financiamento Imobiliário (Concretiza)

## Contexto
A Concretiza atua como **correspondente / agente Caixa** em financiamento
imobiliário. O sistema controla a **fila de produção de conformidade**: a
análise documental das propostas antes de seguir para a Caixa. Hoje o processo
vive em planilhas, e-mail e sistemas da Caixa; o objetivo é centralizar,
priorizar e dar rastreabilidade.

Substitui/organiza o que hoje é feito em planilha, e-mail e sistema Caixa.

## Glossário
- **Proposta**: pedido de financiamento em análise (unidade central da fila).
- **Conformidade**: verificação documental da proposta contra um checklist.
- **Checklist documental**: conjunto de itens obrigatórios (comprador, vendedor,
  imóvel) que precisam estar presentes e válidos.
- **Pendência**: item do checklist reprovado ou faltante que trava a proposta.
- **Analista**: quem executa a conformidade.
- **Coordenador**: distribui a fila, acompanha SLA e resolve exceções.
- **SLA / prazo**: tempo-alvo para concluir uma etapa da conformidade.
- **Agenda**: compromissos dos analistas (assinatura, retorno de pendência,
  prazos), com **Google Calendar** (cada usuário conecta a própria conta Gmail
  no MVP). Visibilidade de agendas alheias é controlada **no Concretiza**
  (compartilhamento usuário/grupo), não via ACL do Google.

## Ciclo de vida da proposta (fases)
Fluxo operacional (usar estes nomes no código e no banco — enum `FaseProcesso`):

```
ENTRADA → ANALISE → ENGENHARIA → CONFORMIDADE → DECISAO → EM_CARTORIO / FORMALIZACAO → FINALIZADO
            ↘ RESTRICAO
            ↘ DEBITO_FGTS (após engenharia, quando aplicável)
            ↘ CANCELADO / REPROVADA
```

Bloqueios (`BloqueioProcesso` + `TipoDependencia`) respondem **por que parou** e
**de quem depende**, sem substituir a fase.

Toda transição de fase deve gerar registro de **histórico/auditoria** (quem,
quando, de/para, observação).

Status legado `StatusProposta` (EM_ANALISE, PENDENCIA, CONFORME, ENVIADA_CAIXA)
foi substituído em 2026-08-01.

## Origem dos dados
Propostas podem entrar por: **cadastro manual**, **importação de Excel** e
**API de parceiro** (previsto). A modelagem deve tolerar as três origens
(campo `origem`).

## Papéis de usuário (RBAC)
- `ADMIN`: configuração, usuários, branding, tudo.
- `COORDENADOR`: distribui fila, vê dashboards, reatribui, ajusta SLA.
- `ANALISTA`: trabalha suas propostas, marca checklist, cria pendências, agenda.
- `VISUALIZACAO`: somente leitura (dashboards e consultas).

## Escopo do MVP
- Entrada de propostas (manual + importação Excel).
- Fila com status e **atribuição a analista** (distribuição pelo coordenador).
- Checklist documental por proposta.
- **Alertas de prazo / SLA**.
- **Dashboard** (produção, SLA, pendências, por analista).
- **Histórico / auditoria** de cada proposta.
- **Agenda** com Google Calendar (OAuth por usuário) + compartilhamento interno.
- Login e papéis (RBAC acima).

## Regras de negócio essenciais
- Uma proposta só vai para `CONFORME` com o checklist 100% aprovado.
- Só `COORDENADOR`/`ADMIN` reatribuem propostas entre analistas.
- SLA é calculado por etapa; alertas quando a etapa se aproxima/estoura o prazo.
- Tempo em `PENDENCIA` (aguardando terceiros) deve ser mensurável separadamente
  do tempo de análise efetiva.

## Fora de escopo (confirmar antes de implementar)
Multi-tenant (várias empresas), assinatura digital, integração direta com
sistemas da Caixa, agendas Google Workspace corporativas compartilhadas.
Se uma solicitação cair aqui, **pergunte ao usuário** antes de seguir e
atualize a memória do projeto.

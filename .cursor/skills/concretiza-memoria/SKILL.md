---
name: concretiza-memoria
description: >-
  Memória viva do projeto Concretiza (escopo, decisões, arquitetura e progresso).
  Use SEMPRE ao iniciar uma tarefa neste projeto para consultar o escopo antes de
  agir, e ao concluir mudanças relevantes para atualizar o registro. Se uma
  solicitação parecer fora do escopo registrado, pergunte ao usuário antes de
  seguir.
---

# Memória do Projeto — Concretiza

## Como usar esta skill
1. **Antes de qualquer tarefa**: ler `docs/MEMORIA_PROJETO.md` para confirmar
   escopo, decisões e o que já existe. Não duplicar trabalho.
2. **Checar escopo**: se a solicitação estiver fora do que está registrado (ou
   na seção "Fora de escopo"), **perguntar ao usuário** se deseja seguir mesmo
   assim antes de implementar.
3. **Ao concluir mudanças relevantes**: atualizar `docs/MEMORIA_PROJETO.md`
   (decisões novas, progresso, itens concluídos, próximos passos). Manter conciso
   e datado.
4. **Antes de encerrar a tarefa**: se houve mudança de código/UI/config, cumprir
   a diretriz de **reinício** (parar 3047 → subir de novo). Ver
   `.cursor/rules/reinicio-obrigatorio.mdc` e skill `concretiza-arquitetura`.

## Arquivo de memória
Fonte única: `docs/MEMORIA_PROJETO.md`.

Manter estas seções sempre atualizadas:
- Objetivo e problema resolvido
- Escopo do MVP / Fora de escopo
- Decisões de arquitetura (stack, banco, deploy)
- Papéis e regras de negócio principais
- Progresso (o que está feito) e Próximos passos
- Diretrizes operacionais (inclui reinício obrigatório)
- Log de decisões (data + decisão)

## Regra
Não sobrescrever `.env` sem confirmar. Não atualizar arquivos markdown de
referência (PRDs) sem pedido explícito — apenas este arquivo de memória é
mantido continuamente.

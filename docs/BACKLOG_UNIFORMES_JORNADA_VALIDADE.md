# BACKLOG_UNIFORMES_JORNADA_VALIDADE.md

## Objetivo

Transformar o plano técnico em etapas implementáveis, com ordem segura de execução e critérios de conclusão.

## Estratégia de Execução

1. Banco e modelo primeiro.
2. Backend (regras e endpoints) em seguida.
3. Frontend por módulos.
4. Relatórios/alertas.
5. Hardening e validação final.

## Legenda

- `P0`: obrigatório para fluxo principal.
- `P1`: importante para operação assistida.
- `P2`: melhoria/otimização.

---

## EPIC 1 — Base de Dados e Migrações

### US-001 — Campos de validade por jornada no cadastro de uniformes
- Prioridade: `P0`
- Dependências: nenhuma
- Entrega:
  1. Migration Prisma para `itemsCloth`:
     - `validadePlantonistaMeses Int @default(12)`
     - `validadeDiaristaMeses Int @default(12)`
  2. Restrição de domínio por validação de aplicação (1..12).
- Critério de pronto:
  - campos existem em banco e client Prisma atualizado.

### US-002 — Limite anual por jornada em configuração
- Prioridade: `P0`
- Dependências: nenhuma
- Entrega:
  1. Migration Prisma para `UniformSetting`:
     - `annualLimitPlantonista Int @default(1)`
     - `annualLimitDiarista Int @default(2)`
  2. manter `annualLimit` legado temporariamente.
- Critério de pronto:
  - leitura/escrita funcionando para novos campos.

### US-003 — Controle de validade/cobrança por item retirado
- Prioridade: `P0`
- Dependências: US-001
- Entrega:
  1. Migration Prisma para `UniformWithdrawalItem`:
     - `dueDate DateTime?`
     - `expiredAt DateTime?`
     - `expirationStatus String @default("ACTIVE")`
     - `isChargeableExtra Int @default(0)`
     - `chargedAt DateTime?`
     - `chargedByUserId Int?`
  2. FK opcional de `chargedByUserId -> User.id`.
- Critério de pronto:
  - colunas criadas e acessíveis via Prisma.

### US-004 — Jornada na retirada
- Prioridade: `P0`
- Dependências: US-002
- Entrega:
  1. Migration para `UniformWithdrawal.workType` (`PLANTONISTA`/`DIARISTA`).
- Critério de pronto:
  - campo disponível e persistente.

---

## EPIC 2 — Backend Regras de Negócio

### US-005 — Cadastro de uniformes com validade por jornada
- Prioridade: `P0`
- Dependências: US-001
- Arquivos-alvo:
  - `API/controllers/itemsControllers.js`
- Entrega:
  1. validar 1..12 em criação/edição;
  2. salvar os dois campos.
- Critério de pronto:
  - create/update aceitam e retornam os campos.

### US-006 — Configuração de limite anual por jornada
- Prioridade: `P0`
- Dependências: US-002
- Arquivos-alvo:
  - `API/controllers/uniformController.js`
- Entrega:
  1. endpoint de update/settings aceitar limites por jornada;
  2. manter compatibilidade temporária com limite global.
- Critério de pronto:
  - settings retornam e persistem limites separados.

### US-007 — Retirada com jornada e cálculo de validade por item
- Prioridade: `P0`
- Dependências: US-003, US-004, US-005, US-006
- Arquivos-alvo:
  - `API/controllers/uniformController.js`
- Entrega:
  1. exigir `workType` na retirada;
  2. aplicar limite anual conforme jornada;
  3. calcular `dueDate` por item;
  4. se `EXEMPT` (label Extra):
     - `dueDate = null`
     - `isChargeableExtra = 1`.
- Critério de pronto:
  - payload de retirada grava jornada e campos por item corretamente.

### US-008 — Marcação de item cobrado no DP e bloqueio de duplicidade
- Prioridade: `P0`
- Dependências: US-003
- Arquivos-alvo:
  - `API/controllers/uniformController.js`
- Entrega:
  1. endpoint/fluxo para marcar cobrança por item;
  2. bloquear nova cobrança se `chargedAt` já preenchido;
  3. registrar `chargedByUserId` e auditoria.
- Critério de pronto:
  - não é possível cobrar o mesmo item duas vezes.

### US-009 — Cálculo de limite anual desconsiderando vencidos
- Prioridade: `P1`
- Dependências: US-007
- Arquivos-alvo:
  - `API/controllers/uniformController.js`
- Entrega:
  1. ajustar consulta de contagem anual;
  2. regra de exclusão por item vencido conforme validação funcional.
- Critério de pronto:
  - cenário de item vencido não bloqueia retirada indevidamente.

---

## EPIC 3 — Frontend Operacional

### US-010 — Cadastro de uniformes com 2 validades (1..12)
- Prioridade: `P0`
- Dependências: US-005
- Arquivos-alvo:
  - `src/Components/Uniformes/CadastroUniformes.jsx`
- Entrega:
  1. campos `Validade Plantonista` e `Validade Diarista`;
  2. seletor 1..12;
  3. labels pt-BR.
- Critério de pronto:
  - criar/editar uniforme persistindo os dois campos.

### US-011 — Retirada com seleção de jornada
- Prioridade: `P0`
- Dependências: US-007
- Arquivos-alvo:
  - `src/Components/Uniformes/RetiradaUniformes.jsx`
- Entrega:
  1. campo obrigatório de jornada;
  2. envio no payload;
  3. exibição de limite anual da jornada no resumo.
- Critério de pronto:
  - retirada não confirma sem jornada.

### US-012 — Configuração de limites por jornada
- Prioridade: `P0`
- Dependências: US-006
- Arquivos-alvo:
  - `src/Components/ProfileTabs/UniformSettings.jsx`
- Entrega:
  1. remover limite único da tela;
  2. adicionar limites plantonista/diarista.
- Critério de pronto:
  - tela salva e recarrega os dois limites.

### US-013 — DP: sinalizar item cobrado
- Prioridade: `P0`
- Dependências: US-008
- Arquivos-alvo:
  - `src/Components/Uniformes/BaixaDpUniformes.jsx`
- Entrega:
  1. mostrar status de cobrança por item;
  2. ação para marcar cobrado;
  3. bloquear botão em item já cobrado.
- Critério de pronto:
  - operador DP não consegue cobrar item duplicado.

---

## EPIC 4 — Alertas e Relatórios

### US-014 — Relatório de vencimento (2 meses)
- Prioridade: `P1`
- Dependências: US-007
- Entrega:
  1. endpoint/filtro para dueDate <= 60 dias;
  2. tela no submenu Relatórios.
- Critério de pronto:
  - lista consistente com dados do banco.

### US-015 — Relatório de vencimento (1 mês)
- Prioridade: `P1`
- Dependências: US-007
- Entrega:
  1. endpoint/filtro para dueDate <= 30 dias.
- Critério de pronto:
  - recorte de 30 dias funcionando.

### US-016 — Relatório de vencidos
- Prioridade: `P1`
- Dependências: US-007
- Entrega:
  1. endpoint/filtro para `dueDate < hoje` não devolvidos;
  2. exportação Excel.
- Critério de pronto:
  - relatório retorna apenas itens vencidos pendentes.

---

## EPIC 5 — Qualidade, Logs e Segurança

### US-017 — Auditoria obrigatória dos novos eventos
- Prioridade: `P0`
- Dependências: US-007, US-008
- Entrega:
  1. logs `UserLog` para:
     - retirada com jornada;
     - marcação de cobrança;
     - alteração de limites;
     - alteração de validade.
- Critério de pronto:
  - auditoria navegável para todos os eventos.

### US-018 — Mensagens e labels em pt-BR
- Prioridade: `P0`
- Dependências: todas as US de frontend
- Entrega:
  1. revisar toasts, labels e textos.
- Critério de pronto:
  - sem textos novos em inglês.

### US-019 — Teste manual de regressão
- Prioridade: `P0`
- Dependências: todas as US P0
- Entrega:
  1. checklist ponta a ponta:
     - cadastro;
     - retirada;
     - devolução;
     - DP;
     - estoque;
     - relatórios existentes.
- Critério de pronto:
  - sem regressões funcionais detectadas.

---

## Ordem Recomendada de Execução (Sprint técnico)

1. US-001, US-002, US-003, US-004
2. US-005, US-006, US-007
3. US-010, US-011, US-012
4. US-008, US-013
5. US-017, US-018, US-019
6. US-009, US-014, US-015, US-016

## Observações de Governança

1. Cada US deve gerar commit isolado quando possível.
2. Não alterar regra legada fora do escopo da US.
3. Atualizar documentação em `docs/` ao fechar cada epic.

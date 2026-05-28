# PLANO_TECNICO_UNIFORMES_JORNADA_VALIDADE.md

## Objetivo

Documentar a evolução do módulo de uniformes para suportar:

1. validade por tipo de jornada (`PLANTONISTA`/`DIARISTA`);
2. limite anual por tipo de jornada;
3. regras de expiração e impacto no limite anual;
4. tratamento específico de retiradas `Extra`;
5. prevenção de cobrança duplicada no DP;
6. relatórios de alerta de vencimento.

## Escopo

### Incluído

- Cadastro de uniformes com validade por jornada.
- Retirada de uniformes com seleção de jornada.
- Cálculo de validade por item retirado.
- Novas regras de status para itens vencidos.
- Controle de cobrança por item.
- Relatórios de vencimento (2 meses, 1 mês, vencidos).

### Fora de escopo (neste ciclo)

- Regras de validade/limite para empréstimos.
- Mudanças em fluxos legados de pijama.

## Regras de Negócio (alvo)

1. Toda retirada de uniforme deve informar tipo de jornada:
   - `PLANTONISTA`;
   - `DIARISTA`.
2. O limite anual será por jornada:
   - `limiteAnualPlantonista`;
   - `limiteAnualDiarista`.
3. A validade do uniforme será por jornada e por item:
   - `validadePlantonistaMeses`;
   - `validadeDiaristaMeses`.
4. Item retirado e não devolvido após validade:
   - passa para estado de expiração;
   - deixa de contar no limite anual.
5. Retirada `Extra` (acima do limite):
   - não terá prazo de devolução;
   - deve ser sinalizada para cobrança.
6. Cobrança no DP:
   - item não pode ser cobrado mais de uma vez;
   - deve haver marcação formal de “cobrado”.

## Modelagem de Dados (proposta)

## 1) UniformSetting (ajuste)

Adicionar:

- `annualLimitPlantonista Int @default(1)`
- `annualLimitDiarista Int @default(2)`

Observação:

- `annualLimit` (global atual) pode ser mantido temporariamente por compatibilidade até migração completa de tela e regras.

## 2) itemsCloth (ajuste para uniformes)

Adicionar:

- `validadePlantonistaMeses Int @default(12)`
- `validadeDiaristaMeses Int @default(12)`

Regras:

- aceitar valores de 1 a 12.

## 3) UniformWithdrawal (ajuste)

Adicionar:

- `workType String @db.VarChar(20)`

Valores:

- `PLANTONISTA`
- `DIARISTA`

## 4) UniformWithdrawalItem (ajuste principal)

Adicionar:

- `dueDate DateTime?` (prazo de devolução do item)
- `expiredAt DateTime?` (data em que foi considerado vencido)
- `expirationStatus String @default("ACTIVE") @db.VarChar(30)`
- `isChargeableExtra Int @default(0)`
- `chargedAt DateTime?`
- `chargedByUserId Int?`

Sugestão de `expirationStatus`:

- `ACTIVE` (dentro da validade)
- `EXPIRED_NOT_RETURNED` (vencido e não devolvido)
- `RETURNED` (devolvido)
- `CHARGED` (cobrado no DP)

Observação:

- `chargedByUserId` com FK para `User`.

## Fluxo de Retirada (novo)

1. Operador informa CPF.
2. Operador seleciona jornada (`PLANTONISTA`/`DIARISTA`).
3. Sistema calcula limite anual com base na jornada.
4. Para cada item:
   - se status final da retirada for `EXEMPT` (label `Extra`):
     - `dueDate = null`;
     - `isChargeableExtra = 1`.
   - caso contrário:
     - `dueDate = dataRetirada + validadeMesesDaJornada`.
5. Grava auditoria (`UserLog`) e movimentações.

## Cálculo de Limite Anual (novo)

- Base atual: contagem de retiradas no ano.
- Nova regra: desconsiderar itens em `EXPIRED_NOT_RETURNED` para bloqueio de nova retirada.

Observação técnica:

- Como limite é por retirada e não por peça, definir regra exata para retirada mista (com itens expirados e ativos).
- Proposta inicial segura:
  - se houver ao menos um item ativo na retirada histórica, a retirada conta;
  - se todos os itens da retirada estiverem expirados sem devolução, retirada deixa de contar.

## Fluxo DP - Cobrança (novo)

1. DP busca pendências por CPF.
2. Sistema exibe itens `Extra` não cobrados (`isChargeableExtra = 1` e `chargedAt is null`).
3. Ao confirmar cobrança:
   - grava `chargedAt`;
   - grava `chargedByUserId`;
   - muda `expirationStatus` para `CHARGED` quando aplicável;
   - impede nova cobrança do mesmo item.

## Relatórios de Alerta (novo)

### Relatório 1: Vence em 2 meses

- Itens com `dueDate` entre hoje e hoje+60 dias.

### Relatório 2: Vence em 1 mês

- Itens com `dueDate` entre hoje e hoje+30 dias.

### Relatório 3: Vencidos

- Itens com `dueDate < hoje` e não devolvidos.

Filtros recomendados:

- CPF
- Colaborador
- Setor
- Jornada
- Status da retirada
- Status de expiração

## Alterações de Frontend (mapa)

1. `CadastroUniformes.jsx`
   - incluir selects/inputs de validade:
     - plantonista (1..12)
     - diarista (1..12)
2. `RetiradaUniformes.jsx`
   - incluir campo obrigatório `Tipo de Jornada`.
   - refletir limite anual por jornada no resumo.
3. `UniformSettings` (aba de configuração)
   - substituir limite único por:
     - limite plantonista
     - limite diarista
4. `BaixaDpUniformes.jsx`
   - incluir sinalização de item já cobrado;
   - bloquear dupla cobrança.
5. Relatórios
   - criar/expandir relatório de vencimento com os 3 recortes.

## Alterações de Backend (mapa)

1. `itemsControllers.js`
   - validar e persistir validade por jornada (1..12).
2. `uniformController.js`
   - aceitar `workType` na retirada;
   - usar limite por jornada;
   - calcular `dueDate` por item;
   - tratar retirada `Extra` sem prazo e com flag de cobrança.
3. `uniformController.js` (DP)
   - marcar item como cobrado;
   - impedir cobrança repetida.
4. Rotinas de consulta/relatórios
   - adicionar endpoints para alertas de validade.

## Migração e Compatibilidade

1. Criar migration Prisma com campos novos.
2. Backfill inicial:
   - itens existentes recebem validade padrão (12 meses, ajustável depois).
3. `UniformSetting`:
   - inicializar limites por jornada com defaults acordados.
4. Preservar status técnico `EXEMPT` com label `Extra`.

## Critérios de Aceite

1. Cadastro de uniforme permite configurar validade por jornada (1..12).
2. Retirada exige jornada e aplica limite correto por jornada.
3. Sistema calcula e grava validade por item retirado.
4. Retirada `Extra` fica sem prazo e sinalizada para cobrança.
5. DP não consegue cobrar o mesmo item duas vezes.
6. Relatórios exibem itens a vencer (2m, 1m) e vencidos.
7. Itens vencidos sem devolução deixam de contar no limite anual conforme regra validada.
8. Auditoria e mensagens seguem padrão já adotado no projeto.

## Dúvidas para validação funcional antes de codar

1. Defaults finais de limite anual por jornada:
   - plantonista?
   - diarista?
2. Regra exata de contagem de limite quando uma retirada tem múltiplos itens com situações diferentes.
3. Em item `Extra` cobrado, o status final esperado no histórico de retirada.
4. Se haverá exceção manual para restaurar prazo de item vencido.

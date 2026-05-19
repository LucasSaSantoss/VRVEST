# PLANO_TECNICO_ESTOQUE_UNIFICADO.md

## 1. Objetivo

Definir a implementação incremental de:

1. Controle de retirada de uniformes.
2. Módulo de entrada de estoque.
3. Controle de estoque com saldos por tamanho.
4. Preparação para futuro módulo de enxoval usando o mesmo núcleo de estoque.

## 2. Premissas confirmadas

1. A retirada de uniforme usará os mesmos colaboradores de `Employee`.
2. Não usar `Pendency` para o módulo de uniformes.
3. Em tabelas novas com FK, não duplicar dados da tabela de origem.
4. O cadastro base de itens pode reaproveitar `itemsCloth` (simples).
5. Uniformes devolvidos não retornam ao estoque principal; vão para estoque de empréstimos.
6. Deve existir operação de descarte de peças.
7. O módulo de retirada deve mostrar a última retirada do colaborador.

## 3. Regras de negócio do módulo uniformes

1. Limite anual condicional por vínculo:
   - plantonista: 1 uniforme/ano;
   - diarista: 2 uniformes/ano.
2. Se exceder limite:
   - com justificativa de não entrega: isento de cobrança;
   - sem justificativa: marcar como cobrável.
3. Para diarista, enquanto ainda houver saldo dentro do limite anual, não há cobrança.
4. Retirada pode conter múltiplos itens e tamanhos.
5. Deve existir histórico para consulta e apoio a desligamento.

## 4. Modelo de dados sugerido

## 4.1 Reaproveitamento de tabela legada

### `itemsCloth` (existente)

Uso:

- cadastro base do item de uniforme.

Evolução sugerida (sem impacto no legado, default seguro):

- `minStock` (int, default 0 ou nullable)
- `isUniform` (int/bool, default 0)

Observação:

- campos novos só serão usados pelas rotinas novas de estoque/uniforme.

## 4.2 Tabelas novas

### `UniformStockSize`

Controle de saldo por tamanho:

- `id`
- `itemId` (FK `itemsCloth`)
- `size` (P, M, G, GG...)
- `qtyMainStock` (estoque principal)
- `qtyLoanStock` (estoque empréstimos)
- `minStock` (opcional; default 0)
- `updatedAt`

### `UniformWithdrawal`

Cabeçalho da retirada:

- `id`
- `employeeId` (FK `Employee`)
- `userId` (FK `User`)
- `year`
- `withdrawDate`
- `totalQuantity`
- `limitApplied` (1 ou 2)
- `status` (`REGULAR`, `CHARGEABLE`, `EXEMPT`)
- `nonDeliveryJustification` (opcional)
- `chargeReason` (opcional)
- `createdAt`
- `updatedAt`

### `UniformWithdrawalItem`

Itens/tamanhos da retirada:

- `id`
- `uniformWithdrawalId` (FK `UniformWithdrawal`)
- `uniformStockSizeId` (FK `UniformStockSize`)
- `quantity`

### `UniformMovement`

Livro de movimentação de estoque:

- `id`
- `uniformStockSizeId` (FK `UniformStockSize`)
- `movementType` (`ENTRY`, `EXIT`, `RETURN_TO_LOAN`, `DISCARD`, `ADJUSTMENT`)
- `quantity`
- `originType` (`WITHDRAWAL`, `SETTLEMENT`, `MANUAL_ENTRY`, `MANUAL_ADJUSTMENT`)
- `referenceType` (opcional)
- `referenceId` (opcional)
- `userId` (FK `User`)
- `notes` (opcional)
- `createdAt`

### `EmployeeWorkType` (opção preferida)

Para não alterar sem necessidade o modelo legado `Employee`:

- `id`
- `employeeId` (FK `Employee`, unique)
- `workType` (`PLANTONISTA`, `DIARISTA`)
- `updatedByUserId` (FK `User`)
- `updatedAt`

## 5. Endpoints sugeridos

## 5.1 Módulo de entrada de estoque (obrigatório)

- `POST /api/uniform-stock/entry`
  - entrada no estoque principal por item+tamanho.
- `POST /api/uniform-stock/loan-entry`
  - entrada direta no estoque de empréstimos (quando aplicável).
- `POST /api/uniform-stock/discard`
  - descarte do estoque principal ou empréstimo (motivo obrigatório).
- `POST /api/uniform-stock/adjustment`
  - ajuste manual (com motivo obrigatório).

## 5.2 Módulo de retirada de uniformes

- `GET /api/uniforms/employee/:cpf/summary?year=2026`
  - colaborador, vínculo, limite anual, total retirado no ano, saldo e última retirada.
- `POST /api/uniforms/withdraw`
  - registra retirada com múltiplos itens/tamanhos.
- `GET /api/uniforms/withdrawals?...`
  - consulta histórica para operação e desligamento.

## 5.3 Liquidação em desligamento

- `PUT /api/uniforms/withdrawals/:id/settlement`
  - marcar devolvido (vai para empréstimos) ou descontado.

## 6. Regras de validação de retirada

1. Validar colaborador ativo.
2. Validar vínculo (`PLANTONISTA`/`DIARISTA`).
3. Calcular limite anual aplicável.
4. Somar retiradas do ano.
5. Se exceder:
   - exigir justificativa para isenção;
   - sem justificativa, marcar como cobrável.
6. Validar saldo por item+tamanho antes de confirmar.
7. Gerar baixa no estoque principal e registrar movimentação.

## 7. Frontend sugerido

## 7.1 Tela de retirada de uniformes

1. Buscar funcionário por CPF.
2. Exibir resumo:
   - vínculo;
   - limite anual;
   - total retirado no ano;
   - saldo;
   - última retirada.
3. Lista dinâmica de retirada:
   - item;
   - tamanho;
   - quantidade;
   - adicionar/remover linha.
4. Se exceder limite:
   - informar cobrança;
   - permitir justificativa de não entrega para isenção.

## 7.2 Tela de entrada de estoque

1. Selecionar item e tamanho.
2. Informar quantidade de entrada.
3. Informar destino:
   - estoque principal;
   - estoque empréstimos.
4. Confirmar operação com registro de movimentação.

## 7.3 Tela de descarte/ajuste

1. Selecionar item+tamanho e origem do estoque.
2. Informar quantidade.
3. Informar motivo (obrigatório).

## 8. Estratégia incremental por fases

## Fase 1 — Banco e backend base

1. Evoluir `itemsCloth` com campos opcionais para estoque.
2. Criar tabelas: `UniformStockSize`, `UniformWithdrawal`, `UniformWithdrawalItem`, `UniformMovement`, `EmployeeWorkType`.
3. Criar rotas/controllers novos:
   - `uniformStockRoutes` / `uniformStockController`;
   - `uniformRoutes` / `uniformController`.

Critério de aceite:

- entrada, retirada, descarte e consulta funcionando via API.

## Fase 2 — Frontend operacional mínimo

1. Tela de entrada de estoque.
2. Tela de retirada com múltiplos itens/tamanhos.
3. Exibição de última retirada.

Critério de aceite:

- operador consegue dar entrada e registrar retirada com validações.

## Fase 3 — Cobrança/isencão e desligamento

1. Regra completa de excedente com cobrança/isenção.
2. Liquidação de retiradas no desligamento.
3. Devolução para estoque de empréstimos.

Critério de aceite:

- cenários de limite e desligamento cobertos sem inconsistência.

## Fase 4 — Preparação enxoval

1. Definir enum/tipos de módulo no núcleo de estoque.
2. Garantir que consultas e movimentos suportem filtros por módulo.

Critério de aceite:

- estrutura pronta para módulo enxoval sem retrabalho de base.

## 9. Riscos e mitigação

1. Misturar uniforme com `Pendency`:
   - mitigação: módulo separado.
2. Inconsistência de saldo por tamanho:
   - mitigação: movimentação obrigatória + validação transacional.
3. Cobrança aplicada incorretamente:
   - mitigação: regra explícita por vínculo + testes de cenário.
4. Mudança em tabela legada:
   - mitigação: campos opcionais/default seguro e uso isolado nas novas rotinas.

## 10. Decisões pendentes para validação final com negócio

1. Lista final de tamanhos e nomenclatura oficial.
2. Taxonomia de itens de uniforme.
3. Política de aceite para justificativa de isenção.
4. Perfil autorizado para liquidar/forçar isenção.
5. Relatórios necessários para cobrança e desligamento.

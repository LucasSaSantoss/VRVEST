# PLANO_TECNICO_ESTOQUE_UNIFICADO.md

## 1. Objetivo

Definir a implementação incremental de:

1. Controle de retirada de uniformes.
2. Controle de estoque unificado para múltiplos módulos.
3. Preparação para futuro módulo de enxoval.

Premissas confirmadas:

- Uniformes usam os mesmos colaboradores já cadastrados (`Employee`).
- Uniformes não seguem fluxo de devolução operacional como pijama.
- Será necessário consultar histórico para desligamento (devolver/descontar).

## 2. Princípios de implementação

1. Não reutilizar `Pendency` para uniformes.
2. Construir núcleo de estoque único e independente do módulo.
3. Manter implementação nova em arquivos separados sempre que viável.
4. Se alterar arquivo existente, comentar trecho com padrão de manutenção.
5. Preservar logs/auditoria e autorização por perfil.

## 3. Arquitetura proposta

### 3.1 Núcleo de estoque (comum)

Responsável por:

- cadastro de itens;
- saldo atual;
- movimentações;
- rastreabilidade por origem.

### 3.2 Módulo de uniformes

Responsável por:

- regras funcionais de retirada por colaborador;
- limite anual global por colaborador;
- consulta histórica por colaborador;
- marcação de acerto (devolvido/descontado) no desligamento.

### 3.3 Módulo enxoval (futuro)

Responsável por suas regras próprias, usando o mesmo núcleo de estoque.

## 4. Modelo de dados sugerido (Prisma)

## 4.1 Tabelas do núcleo de estoque

### `StockItem`

- `id` (PK)
- `moduleType` (`UNIFORME`, `ENXOVAL`, etc.)
- `category` (ex.: camisa, calça, lençol)
- `name`
- `size` (P, M, G, GG, etc.)
- `sku` (opcional)
- `isActive` (boolean/int)
- `createdAt`, `updatedAt`

### `StockBalance`

- `id` (PK)
- `stockItemId` (FK `StockItem`)
- `quantity` (int >= 0)
- `updatedAt`

### `StockMovement`

- `id` (PK)
- `stockItemId` (FK `StockItem`)
- `movementType` (`ENTRY`, `EXIT`, `ADJUSTMENT`, `RETURN`)
- `originType` (`UNIFORM_WITHDRAW`, `UNIFORM_SETTLEMENT`, `ENXOVAL_*`, `MANUAL`)
- `referenceType` (string; ex.: `UniformWithdrawal`)
- `referenceId` (int opcional)
- `quantity` (int > 0)
- `userId` (FK `User`)
- `userNameSnapshot`
- `notes` (opcional)
- `createdAt`

### `StockConfig`

- `id` (PK único lógico, ex.: 1)
- `uniformAnnualLimit` (int)
- `updatedByUserId` (FK `User`)
- `updatedAt`

## 4.2 Tabelas do módulo uniformes

### `UniformWithdrawal`

- `id` (PK)
- `employeeId` (FK `Employee`)
- `employeeNameSnapshot`
- `employeeCpfSnapshot`
- `userId` (FK `User`)
- `userNameSnapshot`
- `year` (int)
- `withdrawDate`
- `totalQuantity`
- `status` (`ACTIVE`, `SETTLED_RETURN`, `SETTLED_DISCOUNT`)
- `settlementDate` (opcional)
- `settlementType` (`RETURN`, `DISCOUNT`, opcional)
- `notes` (opcional)
- `createdAt`, `updatedAt`

### `UniformWithdrawalItem`

- `id` (PK)
- `uniformWithdrawalId` (FK `UniformWithdrawal`)
- `stockItemId` (FK `StockItem`)
- `itemNameSnapshot`
- `sizeSnapshot`
- `quantity`

## 5. Regras de negócio (uniformes)

1. Apenas colaborador válido/ativo pode retirar.
2. Limite anual é global (parametrização única) e aplicado por colaborador.
3. Uma retirada pode ter múltiplos itens/tamanhos.
4. Cada retirada gera saída de estoque por item (`StockMovement` `EXIT`).
5. Sem devolução operacional de rotina.
6. Em desligamento, retirada pode ser liquidada como:
   - devolvido (`SETTLED_RETURN`), gerando movimento `RETURN`;
   - descontado (`SETTLED_DISCOUNT`), sem retorno físico ao estoque.

## 6. Endpoints sugeridos

## 6.1 Configuração

- `GET /api/uniforms/config`
- `PUT /api/uniforms/config`

## 6.2 Consulta do colaborador para retirada

- `GET /api/uniforms/employee/:cpf/summary?year=2026`
- Retorno: dados do colaborador + retirado no ano + limite + saldo disponível.

## 6.3 Retirada de uniforme

- `POST /api/uniforms/withdraw`
- Payload:
  - `cpf`
  - `items`: array de `{ stockItemId, quantity }`
  - `notes` (opcional)

## 6.4 Consulta operacional/histórica

- `GET /api/uniforms/withdrawals?status=&from=&to=&cpf=&name=`

## 6.5 Liquidação no desligamento

- `PUT /api/uniforms/withdrawals/:id/settlement`
- Payload:
  - `settlementType`: `RETURN` ou `DISCOUNT`
  - `notes` (opcional)

## 6.6 Estoque unificado

- `GET /api/stock/items?moduleType=UNIFORME`
- `POST /api/stock/items`
- `PUT /api/stock/items/:id`
- `GET /api/stock/movements?...`
- `POST /api/stock/entry` (entrada manual)
- `POST /api/stock/adjustment` (ajuste manual)

## 7. Frontend sugerido

## 7.1 Módulo Uniformes

Tela “Retirada de Uniformes”:

1. Identificação do colaborador por CPF (padrão atual).
2. Card de resumo anual:
   - limite global;
   - total retirado no ano;
   - saldo disponível.
3. Lista dinâmica de itens:
   - tipo uniforme;
   - tamanho;
   - quantidade;
   - adicionar/remover linha.
4. Confirmar retirada.

Tela “Consulta de Retiradas”:

- filtros por período/cpf/status;
- ação de liquidação (devolvido/descontado).

## 7.2 Módulo Estoque

Tela “Estoque”:

- saldo por item (com filtro por módulo);
- entrada/ajuste manual;
- histórico de movimentações.

## 8. Segurança e autorização

1. Validar permissão no backend por endpoint.
2. Operador:
   - registrar retirada;
   - consultar retiradas.
3. Supervisor/Admin:
   - ajustar limite global;
   - realizar ajustes de estoque;
   - liquidar desligamentos.

## 9. Estratégia de implementação por fases

## Fase 1 — Banco + backend base

1. Criar modelos Prisma de estoque e uniformes.
2. Gerar migration.
3. Criar rotas/controllers novos:
   - `stockRoutes`, `stockController`;
   - `uniformRoutes`, `uniformController`.

Critério de aceite:

- endpoints de configuração, retirada e consulta funcionando via Postman.

## Fase 2 — Integração frontend mínima

1. Criar serviços em `src/services/api.jsx` (ou novo `uniformApi.jsx`).
2. Criar tela de retirada com lista de itens.
3. Exibir resumo anual antes da confirmação.

Critério de aceite:

- retirada com múltiplos itens baixa saldo corretamente e respeita limite anual.

## Fase 3 — Consulta e liquidação

1. Tela de consulta de retiradas.
2. Ação de liquidação por devolução/desconto.
3. Ajustes de estoque para cenário de devolução no desligamento.

Critério de aceite:

- cenário de desligamento registrado sem inconsistência de saldo.

## Fase 4 — Hardening

1. Revisão de permissões.
2. Revisão de logs e auditoria.
3. Documentação final.

Critério de aceite:

- fluxos críticos validados com operação.

## 10. Riscos e mitigação

1. Misturar regra de uniforme com `Pendency`:
   - mitigação: módulo separado.
2. Inconsistência de estoque:
   - mitigação: toda saída/entrada gera `StockMovement` + atualização de saldo transacional.
3. Permissão apenas em frontend:
   - mitigação: validação obrigatória em backend.
4. Regressão no sistema atual:
   - mitigação: novas rotas/arquivos separados e mudanças incrementais.

## 11. Decisões pendentes para validação com negócio

1. Lista oficial de tipos e tamanhos de uniforme.
2. Regra de limite anual (por peça total ou por categoria).
3. Quem pode liquidar desligamento com desconto.
4. Se devolução em desligamento repõe estoque sempre ou sob condições.
5. Se haverá relatórios financeiros vinculados a desconto.

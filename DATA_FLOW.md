# DATA_FLOW.md

## Objetivo

Mapear o fluxo de dados principal para manutenção segura.

## Fluxos de Uniformes

### 1) Consulta por CPF (Retirada/Devolução)

1. Frontend chama `GET /api/uniforms/employee/:cpf/summary`.
2. Backend retorna colaborador, limite anual, retiradas em aberto e pendências por item.

### 2) Retirada

1. Front monta carrinho de itens (`UniformStockSize`).
2. Front chama `POST /api/uniforms/withdraw`.
3. Backend valida perfil (`level >= 3`) e grava:
   - `UniformWithdrawal`;
   - `UniformWithdrawalItem`;
   - `UniformMovement`;
   - `UserLog`.

### 3) Devolução

1. Front chama `POST /api/uniforms/withdrawals/:id/return`.
2. Backend valida perfil (`level >= 3`) e atualiza pendências por item.
3. Itens devolvidos entram no estoque de empréstimos.

### 4) Estoque

1. Front chama endpoints `/api/uniform-stock/*`.
2. Backend valida admin (`level >= 4`).
3. Movimentações gravadas em `UniformMovement` e `UserLog`.

### 5) Baixa DP

1. Front chama `GET /api/uniforms/dp/employee/:cpf/pendencies`.
2. Front chama `PUT /api/uniforms/withdrawals/:id/settlement`.
3. Backend valida RH/admin (`level === 2` ou `level >= 4`).

## Glossário de Status e Tipos

### Status da retirada (`UniformWithdrawal.status`)

- `REGULAR`: retirada dentro da regra.
- `EXEMPT`: retirada acima do limite com justificativa aceita.
- `CHARGEABLE`: retirada acima do limite sem justificativa.
- `PARTIAL_RETURN`: regularização parcial.
- `SETTLED_RETURN`: regularização por devolução física.
- `SETTLED_DISCOUNT`: regularização por baixa financeira (desconto no DP/RH).

### Tipos de movimentação (`UniformMovement.movementType`)

- `ENTRY`, `EXIT`, `RETURN_TO_LOAN`, `ADJUSTMENT`, `DISCARD`, `DISCOUNT`, `REVERSAL`.

# DATA_FLOW.md

## Objetivo

Mapear o fluxo de dados principal para manutenção segura.

## Fluxos de Uniformes

### 1) Consulta por CPF (retirada/devolução)

1. Frontend chama `GET /api/uniforms/employee/:cpf/summary`.
2. Backend retorna colaborador, limite anual, retiradas em aberto e pendências por item.

### 2) Retirada de uniformes

1. Front monta carrinho de itens (`UniformStockSize`).
2. Front chama `POST /api/uniforms/withdraw`.
3. Backend valida perfil operador/supervisor e grava:
   - `UniformWithdrawal`;
   - `UniformWithdrawalItem`;
   - `UniformMovement` (`EXIT`);
   - `UserLog`.
4. Backend tenta enviar e-mail (colaborador + `EMAIL_COPIADO`) e retorna `emailNotification`.

### 3) Devolução de uniformes (normal)

1. Front chama `POST /api/uniforms/withdrawals/:id/return`.
2. Backend valida perfil operador/supervisor e atualiza pendências por item.
3. Itens devolvidos entram no estoque de empréstimos (`RETURN_TO_LOAN`).
4. Backend registra `UserLog` e envia e-mail com `emailNotification`.

### 4) Devolução legada de uniformes

1. Front busca resumo por CPF.
2. Sem retirada pendente, operador usa modo de devolução legada.
3. Front chama `POST /api/uniforms/returns/legacy` com item/tamanho/quantidade/justificativa.
4. Backend registra entrada no estoque de empréstimos + auditoria e envia e-mail com `emailNotification`.

### 5) Empréstimo de uniformes (saída)

1. Front chama `GET /api/uniforms/loan/stock-options`.
2. Front chama `GET /api/uniforms/loan/employee/:cpf/summary`.
3. Front chama `POST /api/uniforms/loan/withdraw`.
4. Backend valida operador/supervisor e grava:
   - `UniformLoan`;
   - `UniformLoanItem`;
   - `UniformMovement` (`LOAN_EXIT`);
   - `UserLog`.
5. Backend envia e-mail (colaborador + `EMAIL_COPIADO`) e retorna `emailNotification`.

### 6) Devolução de empréstimos

1. Front chama `GET /api/uniforms/loan/employee/:cpf/summary`.
2. Front chama `POST /api/uniforms/loan/:id/return` por item.
3. Backend atualiza pendências do empréstimo, incrementa estoque de empréstimos (`LOAN_RETURN`) e atualiza status (`OPEN`/`PARTIAL_RETURN`/`SETTLED_RETURN`).
4. Backend grava `UserLog` e envia e-mail com `emailNotification`.

### 7) Baixa DP

1. Front chama `GET /api/uniforms/dp/employee/:cpf/pendencies`.
2. Front chama `PUT /api/uniforms/withdrawals/:id/settlement` por item.
3. Backend valida DP/supervisor.

### 8) Estoque

1. Front chama endpoints `/api/uniform-stock/*`.
2. Backend valida supervisor/admin.
3. Movimentações gravadas em `UniformMovement` e `UserLog`.

### 9) Cautelas legadas de uniformes

1. Na configuração de uniformes, front lê a planilha com `xlsx` e envia linhas simples em lotes para `POST /api/uniforms/legacy-baselines/import`.
2. Backend valida supervisor/admin.
3. Backend normaliza CPF para 11 dígitos e usa matrícula como fallback.
4. Backend grava/atualiza `UniformLegacyWithdrawalBaseline` por `employeeId` único.
5. Criação/alteração válida registra `UserLog`.
6. Rejeitos retornam na resposta para exportação em Excel e não são gravados no banco principal.
7. Consulta de alertas usa `GET /api/uniforms/legacy-baselines/alerts`, é separada da importação, cruza cautela legada com retiradas oficiais do sistema, considera vencida cautela com 6 meses ou mais e aceita filtros `TODOS`, `VENCIDOS` e `NO_PRAZO`; a tela também aplica busca local por matrícula, CPF ou nome e exibe dias para vencer, com valor negativo quando vencido.

## Relatórios

### 1) Retiradas de uniformes

1. Front chama `GET /api/uniforms/withdrawals` com filtros (`cpf`, `year`, `status`).
2. Exibição detalhada por item.
3. Exportação Excel (`.xlsx`) no frontend.

### 2) Empréstimos de uniformes

1. Front chama `GET /api/uniforms/loans` com filtros (`cpf`, `year`, `status`).
2. Exibição detalhada por item, incluindo quantidade emprestada e devolvida.
3. Exportação Excel (`.xlsx`) no frontend.

### 3) Cautelas legadas de uniformes

1. Front chama `GET /api/uniforms/legacy-baselines/alerts`.
2. Exibição paginada de colaboradores com cautela vencida, no prazo ou todos os baselines, usando a data mais recente entre legado e retirada oficial.
3. Exportação Excel (`.xlsx`) no frontend.

## Glossário de Status e Tipos

### Status da retirada (`UniformWithdrawal.status`)

- `REGULAR`, `EXEMPT`, `CHARGEABLE`, `PARTIAL_RETURN`, `SETTLED_RETURN`, `SETTLED_DISCOUNT`.

### Status do empréstimo (`UniformLoan.status`)

- `OPEN`, `PARTIAL_RETURN`, `SETTLED_RETURN`.

### Tipos de movimentação (`UniformMovement.movementType`)

- `ENTRY`, `EXIT`, `LOAN_EXIT`, `LOAN_RETURN`, `RETURN_TO_LOAN`, `ADJUSTMENT`, `DISCARD`, `DISCOUNT`, `REVERSAL`.

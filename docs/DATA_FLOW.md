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

### 9) Registro de retirada anterior de uniformes

1. Front busca colaborador por CPF e exige data anterior a hoje.
2. Front monta carrinho de itens com uniforme/produto e tamanho.
3. Front chama `POST /api/uniforms/withdraw/retroactive`.
4. Backend valida supervisor, colaborador ativo, jornada, data retroativa e itens.
5. Backend grava `UniformWithdrawal`, `UniformWithdrawalItem` e `UserLog`.
6. Backend não grava `UniformMovement`, não baixa `UniformStockSize.qtyMainStock` e não envia e-mail.
7. A cautela criada fica disponível para devolução futura no fluxo normal, com entrada no estoque de empréstimos, sem envio de e-mail quando a origem for retirada anterior.

### 10) Consulta de retiradas anteriores

1. A tela chama `GET /api/uniforms/withdrawals/retroactive`.
2. Backend retorna apenas registros com `UniformWithdrawal.originType = RETROACTIVE_WITHDRAWAL`.
3. A consulta permite filtrar por todos, vencidos, a vencer ou devolvidos.
4. A tela aplica busca local por matrícula, CPF, nome ou uniforme.
5. A exportação Excel usa os mesmos registros filtrados na tela.

### 11) Dashboard - validade de cautelas

1. Front chama `GET /api/uniforms/withdrawals/open-validity-summary`.
2. Backend considera apenas `UniformWithdrawal` com status aberto e origem `SYSTEM_WITHDRAWAL` ou `RETROACTIVE_WITHDRAWAL`.
3. Cautelas devolvidas ou baixadas não entram no resumo.
4. A data de vencimento considerada é a primeira data pendente da cautela.
5. O card separa vencidas, até 30 dias, 31 a 89 dias e 90 dias ou mais.

### 12) Cautelas históricas antigas

1. A importação por planilha foi descontinuada como rotina operacional.
2. O endpoint `GET /api/uniforms/legacy-baselines/alerts` permanece apenas para compatibilidade com dados antigos e usos internos existentes.

## Fluxo Legado de Colaboradores

### 1) Cadastro de colaborador

1. Front chama `POST /api/empl`.
2. Backend valida campos obrigatórios e duplicidade conhecida de e-mail/CPF.
3. Se o banco retornar violação de chave única (`P2002`), backend devolve mensagem específica para e-mail ou CPF já cadastrado.
4. Front deve exibir a mensagem retornada pelo backend, sem substituir por erro genérico quando a causa for conhecida.

## Relatórios

### 1) Retiradas de uniformes

1. Front chama `GET /api/uniforms/withdrawals/years` para popular o select de anos existentes.
2. Front chama `GET /api/uniforms/withdrawals` com filtros (`cpf`, `year`, `status`); quando o ano estiver em `Todos`, o parâmetro `year` não é enviado.
2. Exibição detalhada por item.
3. Exportação Excel (`.xlsx`) no frontend.

### 2) Empréstimos de uniformes

1. Front chama `GET /api/uniforms/loans` com filtros (`cpf`, `year`, `status`).
2. Exibição detalhada por item, incluindo quantidade emprestada e devolvida.
3. Exportação Excel (`.xlsx`) no frontend.

### 3) Retiradas anteriores de uniformes

1. Front chama `GET /api/uniforms/withdrawals/retroactive`.
2. Exibição paginada dos registros lançados manualmente na Fase 1.
3. Exportação Excel (`.xlsx`) no frontend.

### 4) Dashboard - validade de cautelas

1. Front chama `GET /api/uniforms/withdrawals/open-validity-summary`.
2. Exibição dos totais por faixa de vencimento, considerando apenas cautelas abertas.

## Glossário de Status e Tipos

### Status da retirada (`UniformWithdrawal.status`)

- `REGULAR`, `EXEMPT`, `CHARGEABLE`, `PARTIAL_RETURN`, `SETTLED_RETURN`, `SETTLED_DISCOUNT`.

### Status do empréstimo (`UniformLoan.status`)

- `OPEN`, `PARTIAL_RETURN`, `SETTLED_RETURN`.

### Tipos de movimentação (`UniformMovement.movementType`)

- `ENTRY`, `EXIT`, `LOAN_EXIT`, `LOAN_RETURN`, `RETURN_TO_LOAN`, `ADJUSTMENT`, `DISCARD`, `DISCOUNT`, `REVERSAL`.

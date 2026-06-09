# AI_CONTEXT.md

## Objetivo do Projeto

Sistema de controle da rouparia hospitalar para cadastro de colaboradores, controle de retirada/devolução de pijamas, controle de pendências e controle de uniformes (cadastro, estoque, retirada, devolução, empréstimos e baixa DP), com auditoria.

## Perfis de Usuário (`User.level`)

### Confirmado no código

1. `level = 4` (Supervisor):
   - estoque de uniformes;
   - cadastro de uniformes;
   - cautelas legadas de uniformes;
   - relatórios administrativos de uniformes;
   - baixa DP de uniformes;
   - retirada/devolução/empréstimos;
   - módulos administrativos existentes.
2. `level = 3` (DP):
   - baixa DP de uniformes.
3. `level = 2` (Controlador):
   - cadastro de uniformes;
   - estoque de uniformes;
   - cautelas legadas de uniformes;
   - relatório de estoque.
4. `level = 1` (Operador):
   - retirada de uniformes;
   - devolução de uniformes;
   - empréstimo de uniformes;
   - devolução de empréstimos.

## Módulos de Uniformes (separação atual)

1. `Retirada de Uniformes`.
2. `Devolução de Uniformes`.
3. `Empréstimo de Uniformes`.
4. `Devolução de Empréstimos`.
5. `Baixa de Uniformes - DP`.
6. `Cadastro de Uniformes`.
7. `Estoque de Uniformes`.
8. `Cautelas Legadas de Uniformes`.

## Fluxos Principais (Uniformes)

1. Estoque (`/api/uniform-stock/*`): controlador/supervisor.
2. Retirada (`/api/uniforms/*`): operador/supervisor.
3. Devolução (`/api/uniforms/*`): operador/supervisor.
4. Empréstimo (`/api/uniforms/loan/*`): operador/supervisor.
5. Devolução de empréstimos (`/api/uniforms/loan/*`): operador/supervisor.
6. Baixa DP (`/api/uniforms/dp/*` e settlement): DP/supervisor.
7. Cautelas legadas: consulta (`GET /api/uniforms/legacy-baselines/alerts`) liberada para usuários autenticados; importação (`POST /api/uniforms/legacy-baselines/import`) restrita a supervisor/admin.

## Notificações de E-mail (Uniformes)

### Confirmado no código

1. Retirada de uniformes: envia para colaborador (quando houver e-mail) e `EMAIL_COPIADO`.
2. Devolução de uniformes (normal/legada): envia para colaborador e `EMAIL_COPIADO`.
3. Empréstimo de uniformes: envia para colaborador e `EMAIL_COPIADO`.
4. Devolução de empréstimos: envia para colaborador e `EMAIL_COPIADO`.
5. Resposta da API inclui `emailNotification` para feedback operacional no frontend.

## Relatórios de Uniformes

### Confirmado no código

1. Relatório de retiradas de uniformes.
2. Relatório de empréstimos de uniformes.
3. Relatório de vencimentos de uniformes.
4. Relatório de estoque de uniformes.
5. Consulta de cautelas legadas com exportação para Excel (`.xlsx`).

## Cautelas Legadas de Uniformes

### Confirmado no código

1. A planilha legada não gera `UniformWithdrawal`, `UniformWithdrawalItem` nem `UniformMovement`.
2. A tabela `UniformLegacyWithdrawalBaseline` guarda somente `employeeId` e `lastWithdrawalDate` como dados de negócio.
3. A importação cruza primeiro por CPF normalizado para 11 dígitos; matrícula é fallback/validação de conflito.
4. Importações repetidas atualizam o registro existente por `employeeId`, sem duplicar.
5. Rejeitos retornam para exportação no frontend e não são gravados em `UserLog`.
6. Criação/alteração de baseline válida registra `UserLog`.
7. O alerta considera vencida a cautela com 6 meses ou mais desde a data mais recente entre `UniformLegacyWithdrawalBaseline.lastWithdrawalDate` e `UniformWithdrawal.withdrawDate`; a consulta inicia em `TODOS` e permite filtrar por `VENCIDOS` ou `NO_PRAZO` e pesquisar por matrícula, CPF ou nome; a coluna de prazo mostra dias para vencer, com valor negativo quando vencido.

## Glossário de Status (Uniformes)

### `UniformWithdrawal.status`

- `REGULAR`: retirada dentro da regra.
- `EXEMPT`: retirada extra (acima do limite) com justificativa aceita.
- `CHARGEABLE`: retirada acima do limite sem justificativa.
- `PARTIAL_RETURN`: retirada parcialmente regularizada.
- `SETTLED_RETURN`: retirada regularizada por devolução física.
- `SETTLED_DISCOUNT`: retirada regularizada por baixa financeira (desconto no DP/RH).

### `UniformLoan.status`

- `OPEN`: empréstimo em aberto.
- `PARTIAL_RETURN`: devolução parcial do empréstimo.
- `SETTLED_RETURN`: empréstimo totalmente devolvido.

### `UniformMovement.movementType`

- `ENTRY`, `EXIT`, `LOAN_EXIT`, `LOAN_RETURN`, `RETURN_TO_LOAN`, `ADJUSTMENT`, `DISCARD`, `DISCOUNT`, `REVERSAL`.

## Pontos de Atenção

1. Em base legada importada, datas inválidas (`0000-00-00`) podem quebrar consultas Prisma.
2. Manter saneamento pós-importação para estabilidade operacional.
3. Manter textos operacionais em português brasileiro para reduzir erro de uso.

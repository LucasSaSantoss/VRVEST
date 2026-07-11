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
8. `Consulta Retiradas Anteriores`.
9. `Registro de Retirada Anterior` (somente supervisor).

## Fluxos Principais (Uniformes)

1. Estoque (`/api/uniform-stock/*`): controlador/supervisor.
2. Retirada (`/api/uniforms/*`): operador/supervisor.
3. Devolução (`/api/uniforms/*`): operador/supervisor.
4. Empréstimo (`/api/uniforms/loan/*`): operador/supervisor.
5. Devolução de empréstimos (`/api/uniforms/loan/*`): operador/supervisor.
6. Baixa DP (`/api/uniforms/dp/*` e settlement): DP/supervisor.
7. Cautelas históricas: consulta (`GET /api/uniforms/legacy-baselines/alerts`) liberada para usuários autenticados; importação por planilha descontinuada e substituída por registro manual de retirada anterior (`POST /api/uniforms/withdraw/retroactive`), restrito a supervisor.

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

## Cautelas Históricas e Registro de Retirada Anterior

### Confirmado no código

1. A importação por planilha foi descontinuada como rotina operacional.
2. A consulta `GET /api/uniforms/legacy-baselines/alerts` permanece para dados históricos já existentes.
3. O lan?amento manual usa `POST /api/uniforms/withdraw/retroactive`.
4. Apenas supervisor pode registrar retirada anterior.
5. O registro anterior grava `UniformWithdrawal`, `UniformWithdrawalItem` e `UserLog`.
6. O registro anterior não baixa estoque principal e não envia e-mail.
7. A validade da cautela é calculada a partir da data retroativa informada.
8. A devolução futura segue o fluxo de devolução normal e entra no estoque de empréstimos, sem envio de e-mail quando a origem for retirada anterior.

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

## Legado de Colaboradores

### Confirmado no código

1. Cadastro e alteração de colaboradores continuam no fluxo legado `/api/empl`.
2. Violações de chave única do Prisma (`P2002`) devem retornar mensagem específica quando envolverem `email` ou `cpf`.
3. Frontend deve preservar a mensagem retornada pelo backend para evitar erro genérico quando a causa for conhecida.

## Pontos de Atenção

1. Em base legada importada, datas inválidas (`0000-00-00`) podem quebrar consultas Prisma.
2. Manter saneamento pós-importação para estabilidade operacional.
3. Manter textos operacionais em português brasileiro para reduzir erro de uso.

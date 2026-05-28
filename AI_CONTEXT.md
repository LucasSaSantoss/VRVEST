# AI_CONTEXT.md

## Objetivo do Projeto

Sistema de controle da rouparia hospitalar para cadastro de colaboradores, controle de retirada/devolução de pijamas, controle de pendências e controle de uniformes (cadastro, estoque, retirada, devolução, empréstimos e baixa DP), com auditoria.

## Perfis de Usuário (`User.level`)

### Confirmado no código

1. `level = 4` (Admin):
   - estoque de uniformes;
   - cadastro de uniformes;
   - retirada de uniformes;
   - devolução de uniformes;
   - empréstimo de uniformes;
   - devolução de empréstimos;
   - baixa DP de uniformes;
   - módulos administrativos existentes.
2. `level = 3` (Operador):
   - retirada de uniformes;
   - devolução de uniformes;
   - empréstimo de uniformes;
   - devolução de empréstimos.
3. `level = 2` (RH/DP):
   - baixa DP de uniformes.
4. `level = 1`:
   - perfil básico legado (QR Code).

## Módulos de Uniformes (separação atual)

1. `Retirada de Uniformes`.
2. `Devolução de Uniformes`.
3. `Empréstimo de Uniformes`.
4. `Devolução de Empréstimos`.
5. `Baixa de Uniformes - DP`.
6. `Cadastro de Uniformes`.
7. `Estoque de Uniformes`.

## Fluxos Principais (Uniformes)

1. Estoque (`/api/uniform-stock/*`): somente admin.
2. Retirada (`/api/uniforms/*`): operador/admin.
3. Devolução (`/api/uniforms/*`): operador/admin.
4. Empréstimo (`/api/uniforms/loan/*`): operador/admin.
5. Devolução de empréstimos (`/api/uniforms/loan/*`): operador/admin.
6. Baixa DP (`/api/uniforms/dp/*` e settlement): RH/admin.

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
3. Ambos com exportação para Excel (`.xlsx`).

## Glossário de Status (Uniformes)

### `UniformWithdrawal.status`

- `REGULAR`: retirada dentro da regra.
- `EXEMPT`: retirada acima do limite com justificativa aceita.
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

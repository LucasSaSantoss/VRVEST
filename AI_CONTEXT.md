# AI_CONTEXT.md

## Objetivo do Projeto

Sistema de controle da rouparia hospitalar para cadastro de colaboradores, controle de retirada/devolução de pijamas, controle de pendências e controle de uniformes (cadastro, estoque, retirada/devolução e baixa DP), com auditoria.

## Perfis de Usuário (`User.level`)

### Confirmado no código

1. `level = 4` (Admin):
   - estoque de uniformes;
   - cadastro de uniformes;
   - retirada/devolução de uniformes;
   - baixa DP de uniformes;
   - módulos administrativos existentes.
2. `level = 3` (Operador):
   - retirada/devolução de uniformes.
3. `level = 2` (RH/DP):
   - baixa DP de uniformes.
4. `level = 1`:
   - perfil básico legado (QR Code).

## Fluxos Principais (Uniformes)

1. Estoque (`/api/uniform-stock/*`): somente admin.
2. Retirada/devolução (`/api/uniforms/*`): operador/admin.
3. Baixa DP (`/api/uniforms/dp/*` e settlement): RH/admin.

## Glossário de Status (Uniformes)

### `UniformWithdrawal.status`

- `REGULAR`: retirada dentro da regra.
- `EXEMPT`: retirada acima do limite com justificativa aceita.
- `CHARGEABLE`: retirada acima do limite sem justificativa.
- `PARTIAL_RETURN`: retirada parcialmente regularizada.
- `SETTLED_RETURN`: retirada regularizada por devolução física.
- `SETTLED_DISCOUNT`: retirada regularizada por baixa financeira (desconto no DP/RH).

### `UniformMovement.movementType`

- `ENTRY`: entrada no estoque.
- `EXIT`: saída por retirada.
- `RETURN_TO_LOAN`: devolução para empréstimos.
- `ADJUSTMENT`: ajuste manual/transferência.
- `DISCARD`: descarte.
- `DISCOUNT`: baixa financeira.
- `REVERSAL`: desfazer movimentação.

## Pontos de Atenção

1. Em base legada importada, datas inválidas (`0000-00-00`) podem quebrar consultas Prisma.
2. Manter saneamento pós-importação para estabilidade operacional.

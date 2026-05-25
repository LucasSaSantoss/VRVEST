# BUSINESS_RULES.md

## Objetivo

Consolidar regras de negócio do módulo de uniformes, separando o que está confirmado no código, o que é inferido e o que ainda depende de validação.

## Regras Confirmadas no Código

1. Login exige usuário ativo e senha válida.
2. Autorização usa `User.level` no JWT.
3. Estoque de uniformes:
   - acesso somente admin (`level >= 4`);
   - operações com registro de auditoria.
4. Retirada/devolução de uniformes:
   - acesso para operador e admin (`level >= 3`);
   - retirada por CPF;
   - quantidade fixa `1` por item da retirada;
   - não permite repetir o mesmo uniforme no carrinho da mesma retirada.
5. Empréstimo de uniformes:
   - acesso para operador e admin (`level >= 3`);
   - controla saída e devolução no estoque de empréstimos;
   - não possui limite anual;
   - não permite empréstimo com saldo de empréstimos zerado/insuficiente.
6. Baixa de uniformes no DP:
   - acesso para RH e admin (`level === 2` ou `level >= 4`);
   - baixa financeira por item/quantidade pendente.
7. Estoque por tamanho:
   - estoque principal e empréstimos;
   - entrada, ajuste, transferência e descarte;
   - histórico de movimentações.
8. Limite anual:
   - controlado por configuração global (`UniformSetting`).

## Regras Inferidas

1. Separação operacional por setor:
   - rouparia: retirada/devolução;
   - RH/DP: baixa financeira.
2. A trilha de auditoria principal do módulo é `UniformMovement` + `UserLog`.

## Regras Pendentes de Validação

1. Nomenclatura oficial dos perfis por `level`.
2. Política formal para exceções de limite e isenções.
3. Regras finais para futura integração com módulo de enxoval.
4. Política funcional para devolução de passivo legado (uniformes retirados antes do sistema).

## Regra Planejada (Ainda Não Implementada)

1. Devolução legada no mesmo módulo de devolução:
   - quando não houver retirada registrada para o CPF;
   - permitir entrada manual de item/tamanho/quantidade;
   - exigir justificativa obrigatória;
   - registrar entrada no estoque de empréstimos com rastreabilidade completa.

## Permissões por Perfil (Uniformes)

1. `level = 4` (Admin):
   - estoque de uniformes;
   - cadastro de uniformes;
   - retirada/devolução;
   - empréstimos de uniformes;
   - baixa DP.
2. `level = 3` (Operador):
   - retirada/devolução;
   - empréstimos de uniformes.
3. `level = 2` (RH/DP):
   - baixa DP.
4. `level = 1`:
   - não participa do fluxo de uniformes.

## Glossário de Status (Uniformes)

### Status da retirada (`UniformWithdrawal.status`)

1. `REGULAR`:
   - retirada dentro da regra, sem exceção de limite.
2. `EXEMPT`:
   - retirada acima do limite com justificativa aceita (isenta de cobrança).
3. `CHARGEABLE`:
   - retirada acima do limite sem justificativa (passível de cobrança).
4. `PARTIAL_RETURN`:
   - parte dos itens foi devolvida/baixada, mas ainda há pendência.
5. `SETTLED_RETURN`:
   - retirada totalmente regularizada por devolução física.
6. `SETTLED_DISCOUNT`:
   - retirada totalmente regularizada por baixa financeira.
   - significa que os itens pendentes foram encerrados por desconto no DP/RH, não por devolução física.

### Tipos de movimentação (`UniformMovement.movementType`)

1. `ENTRY`: entrada de estoque.
2. `EXIT`: saída por retirada.
3. `RETURN_TO_LOAN`: devolução para estoque de empréstimos.
4. `ADJUSTMENT`: ajuste manual/transferência.
5. `DISCARD`: descarte de peça.
6. `DISCOUNT`: baixa financeira de pendência.
7. `REVERSAL`: desfazimento de movimentação.

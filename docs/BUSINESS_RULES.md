# BUSINESS_RULES.md

## Objetivo

Consolidar regras de negócio do módulo de uniformes, separando o que está confirmado no código, o que é inferido e o que ainda depende de validação.

## Regras Confirmadas no Código

1. Login exige usuário ativo e senha válida.
2. Autorização usa `User.level` no JWT.
3. Estoque de uniformes:
   - acesso somente admin (`level >= 4`);
   - operações com registro de auditoria.
4. Retirada de uniformes:
   - acesso para operador e admin (`level >= 3`);
   - retirada por CPF;
   - quantidade fixa `1` por item da retirada;
   - não permite repetir o mesmo uniforme no carrinho da mesma retirada.
5. Devolução de uniformes:
   - acesso para operador e admin (`level >= 3`);
   - devolução por item;
   - quantidade inicial preenchida com pendência do item;
   - devolução normal entra no estoque de empréstimos.
6. Devolução legada de uniformes:
   - ocorre no módulo de devolução de uniformes;
   - disponível quando não há retirada pendente para o CPF;
   - exige justificativa obrigatória;
   - gera entrada no estoque de empréstimos com auditoria.
7. Empréstimo de uniformes:
   - acesso para operador e admin (`level >= 3`);
   - módulo específico para saída de empréstimo;
   - não possui limite anual;
   - não permite empréstimo com saldo de empréstimos zerado/insuficiente.
8. Devolução de empréstimos:
   - módulo específico separado da saída de empréstimo;
   - devolução por item/quantidade pendente.
9. Baixa de uniformes no DP:
   - acesso para RH e admin (`level === 2` ou `level >= 4`);
   - baixa financeira por item/quantidade pendente.
10. Limite anual:
   - controlado por configuração global (`UniformSetting`).

## Regras Inferidas

1. Separação operacional por setor:
   - rouparia: retirada/devolução e empréstimos;
   - RH/DP: baixa financeira.
2. Trilha de auditoria principal: `UniformMovement` + `UserLog`.
3. Separação de módulos reduz ambiguidade para operadores com baixa familiaridade em sistemas.

## Regras Pendentes de Validação

1. Nomenclatura oficial dos perfis por `level` (comunicação institucional).
2. Política formal para exceções de limite e isenções.
3. Regras finais para futura integração com módulo de enxoval.

## Notificações de E-mail (confirmado no código)

1. Envio em retirada de uniformes.
2. Envio em devolução de uniformes (normal e legada).
3. Envio em empréstimo de uniformes.
4. Envio em devolução de empréstimos.
5. Destinatários:
   - colaborador (quando e-mail disponível);
   - `EMAIL_COPIADO`.
6. Falhas de envio:
   - não cancelam a operação principal;
   - ficam registradas em log.

## Permissões por Perfil (Uniformes)

1. `level = 4` (Admin):
   - todos os módulos de uniformes.
2. `level = 3` (Operador):
   - retirada de uniformes;
   - devolução de uniformes;
   - empréstimo de uniformes;
   - devolução de empréstimos.
3. `level = 2` (RH/DP):
   - baixa de uniformes - DP.
4. `level = 1`:
   - não participa do fluxo de uniformes.

## Glossário de Status (Uniformes)

### Status da retirada (`UniformWithdrawal.status`)

1. `REGULAR`: retirada dentro da regra.
2. `EXEMPT`: retirada extra (acima do limite) com justificativa aceita.
3. `CHARGEABLE`: retirada acima do limite sem justificativa.
4. `PARTIAL_RETURN`: parte dos itens ainda pendente.
5. `SETTLED_RETURN`: regularizada por devolução física total.
6. `SETTLED_DISCOUNT`: regularizada por baixa financeira (desconto no DP/RH).

### Status do empréstimo (`UniformLoan.status`)

1. `OPEN`: empréstimo em aberto.
2. `PARTIAL_RETURN`: empréstimo parcialmente devolvido.
3. `SETTLED_RETURN`: empréstimo totalmente devolvido.

### Tipos de movimentação (`UniformMovement.movementType`)

1. `ENTRY`: entrada de estoque.
2. `EXIT`: saída por retirada.
3. `LOAN_EXIT`: saída por empréstimo.
4. `LOAN_RETURN`: devolução de empréstimo.
5. `RETURN_TO_LOAN`: devolução para estoque de empréstimos.
6. `ADJUSTMENT`: ajuste manual/transferência.
7. `DISCARD`: descarte de peça.
8. `DISCOUNT`: baixa financeira de pendência.
9. `REVERSAL`: desfazimento de movimentação.

# PROPOSTA_FUNCIONAL_DEVOLUCAO_LEGADA_UNIFORMES.md

## Contexto

Existe passivo de uniformes retirados antes da existência do sistema. Esses itens poderão ser devolvidos (ou não) futuramente pelos colaboradores.

## Problema

No modelo atual, a devolução depende de uma retirada previamente registrada no sistema. Para o passivo legado, essa retirada não existe.

## Objetivo

Permitir o recebimento de devoluções legadas **sem criar novo módulo**, usando a rotina já existente de devolução de uniformes.

## Proposta de Solução

Implementar no módulo `Devolução de Uniformes` um modo adicional:

1. Ao buscar CPF:
   - se houver retirada em aberto: fluxo atual (sem mudança);
   - se não houver retirada em aberto: habilitar opção `Registrar Devolução Legada`.
2. Na devolução legada, operador informa:
   - produto/uniforme;
   - tamanho;
   - quantidade;
   - justificativa obrigatória (origem legada).
3. O sistema registra movimentação de entrada no estoque de empréstimos com rastreabilidade completa.

## Regras Operacionais Sugeridas

1. A devolução legada não altera limite anual de retirada.
2. A devolução legada não cria cobrança automática.
3. A justificativa é obrigatória.
4. A operação deve registrar usuário, data/hora e origem da operação.

## Auditoria e Rastreabilidade

1. Registrar em `UniformMovement` com tipo/origem explícitos de legado.
2. Registrar em `UserLog` com payload completo da ação.
3. Exibir em histórico como `Devolução Legada`.

## Permissões

Manter a mesma permissão da devolução atual:

1. `level >= 3` (operador/admin).

## Benefícios

1. Evita criar nova tela para o usuário.
2. Resolve passivo legado no fluxo já conhecido.
3. Mantém governança e auditoria do processo.

## Riscos e Mitigações

1. Risco: operador usar devolução legada indevidamente.
   - Mitigação: justificativa obrigatória e trilha de auditoria.
2. Risco: divergência de interpretação entre setores.
   - Mitigação: validar regra com rouparia e RH antes de publicar.

## Status

Documento de proposta funcional para validação com usuários e gestão.  
Implementação ainda não iniciada.

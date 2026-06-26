# Plano Técnico - Retiradas Retroativas de Uniformes

## Objetivo

Substituir a importação por planilha de cautelas históricas por uma rotina manual de registro de retiradas anteriores, usando o fluxo oficial de retirada de uniformes como base.

A rotina deve registrar colaborador, jornada, data real da retirada, uniforme, tamanho e quantidade, sem baixar o estoque atual e sem enviar e-mail.

## Motivação

A planilha histórica não possui dados suficientes para controle confiável, principalmente item, tamanho, jornada e quantidade detalhada.

Com o registro manual, cada lançamento passa a gerar uma cautela rastreável, devolvível e útil para consultas de validade e planejamento futuro de reposição.

## Fase 1 - Registro de Retirada Anterior

### Decisões Confirmadas

1. A rotina se chama Registro de Retirada Anterior.
2. Apenas supervisor pode acessar e registrar.
3. A data informada deve ser sempre anterior à data atual.
4. A rotina gera UniformWithdrawal e UniformWithdrawalItem.
5. A rotina registra auditoria em UserLog.
6. A rotina não baixa estoque principal.
7. A rotina não cria UniformMovement no lançamento.
8. A rotina não envia e-mail no lançamento.
9. A devolução futura também não envia e-mail quando a origem for retirada anterior.
10. A devolução futura entra no estoque de empréstimos, seguindo o fluxo de devolução normal.
11. A importação por planilha foi removida da operação.
12. A consulta de cautelas históricas permanece enquanto existirem dados antigos.

### Regra de Negócio

1. Buscar colaborador por CPF.
2. Exigir jornada: plantonista ou diarista.
3. Exigir data de retirada anterior.
4. Exigir uniforme/produto.
5. Exigir tamanho.
6. Registrar quantidade conforme o carrinho da retirada.
7. Calcular validade a partir da data retroativa informada.
8. Aplicar a regra de limite anual conforme jornada e ano da data informada.
9. Exigir justificativa quando o limite anual for excedido.
10. Criar pendência devolvível.
11. Não afetar saldo atual do estoque principal.

### Diferenças Para Retirada Normal

| Ponto | Retirada normal | Registro de retirada anterior |
|---|---|---|
| Data | Data atual | Data informada pelo supervisor |
| Permite data de hoje | Sim | Não |
| Baixa estoque principal | Sim | Não |
| Gera cautela | Sim | Sim |
| Gera pendência | Sim | Sim |
| Envia e-mail no lançamento | Sim | Não |
| Devolução entra no estoque de empréstimos | Sim | Sim |
| Envia e-mail na devolução | Sim | Não |

## Banco de Dados

### Alteração Implementada

Foi adicionado o campo originType em UniformWithdrawal.

Valores usados:

1. SYSTEM_WITHDRAWAL: retirada normal feita pelo sistema.
2. RETROACTIVE_WITHDRAWAL: retirada anterior registrada manualmente.

Motivo: diferenciar a origem sem depender de texto livre em observações.

## Backend

### Endpoint

POST /api/uniforms/withdraw/retroactive

### Gravações

1. UniformWithdrawal.
2. UniformWithdrawalItem.
3. UserLog com ação UNIFORM_RETROACTIVE_WITHDRAWAL_CREATE.

### Não Grava

1. UniformMovement no lançamento retroativo.
2. Saída de estoque principal.
3. E-mail de lançamento.

### Devolução

A devolução usa o fluxo normal de devolução de retirada, mas suprime e-mail quando UniformWithdrawal.originType for RETROACTIVE_WITHDRAWAL.

## Frontend

### Tela

A tela Registro de Retirada Anterior fica no menu de Uniformes e aparece somente para supervisor.

Campos principais:

1. CPF.
2. Data da retirada anterior.
3. Jornada.
4. Uniforme/produto.
5. Tamanho.
6. Carrinho.
7. Justificativa quando exceder limite.
8. Observação opcional.

### Texto de Apoio

A tela deve deixar claro que:

1. A rotina serve apenas para registrar retirada antiga que não foi lançada no sistema.
2. A rotina não baixa o estoque atual.
3. A devolução futura entrará no estoque de empréstimos.

## Remoção da Importação por Planilha

Itens removidos na fase 1:

1. Entrada da importação na configuração de uniformes.
2. Rota operacional de importa??o por planilha.
3. Componente frontend de importação por planilha.

Itens mantidos por compatibilidade:

1. Consulta GET /api/uniforms/legacy-baselines/alerts.
2. Tabela UniformLegacyWithdrawalBaseline, até decisão futura de limpeza.

## Fase 2 - Controle de Reposição

Esta fase não deve ser implementada junto com a fase 1.

Sugestões para a próxima fase:

1. Relatório de consumo por uniforme e tamanho.
2. Curva ABC por volume de saída.
3. Cobertura de estoque por média mensal de consumo.
4. Sugestão de compra considerando estoque atual, estoque mínimo, consumo médio e prazo de reposição.
5. Filtros por origem: retirada normal e retirada anterior.

## Pendências Futuras

1. Decidir se a tela Consulta de Cautelas Históricas será renomeada.
2. Decidir se UniformLegacyWithdrawalBaseline será removida futuramente ou apenas mantida sem nova importação.
3. Definir a abordagem final do controle de reposição na fase 2.

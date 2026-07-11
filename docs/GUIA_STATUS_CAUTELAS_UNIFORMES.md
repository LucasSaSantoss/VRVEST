# Guia de Status e Validade de Cautelas de Uniformes

Este documento explica, de forma simples, o que significa cada status usado nas cautelas de uniformes e como interpretar o card **Validade de Cautelas** no Dashboard.

## O que é uma cautela?

No módulo de uniformes, uma cautela representa uma retirada de uniforme feita por um colaborador.

Uma cautela pode ter um ou mais itens. Por exemplo:

- 1 camisa.
- 1 calça.
- 1 camisa e 1 calça na mesma retirada.

Por isso, um relatório pode mostrar mais linhas do que a quantidade real de cautelas, pois cada item pode aparecer em uma linha separada.

## Diferença entre cautela, item e colaborador

**Cautela**

É a retirada registrada no sistema.

Exemplo: `Retirada #17`.

**Item**

É cada uniforme dentro da cautela.

Exemplo: camisa, calça, jaleco.

**Colaborador**

É a pessoa que fez a retirada.

O Dashboard de validade trabalha por colaborador, considerando a última cautela válida dele.

## Status das cautelas

### Retirada sem devolução

É uma retirada normal ainda sem devolução.

Status técnico: `REGULAR`.

Essa cautela ainda conta para a validade.

### Extra

É uma retirada liberada como exceção.

Status técnico: `EXEMPT`.

Essa cautela ainda conta para a validade enquanto não for totalmente encerrada.

### Com cobrança

É uma retirada que possui indicação de cobrança.

Status técnico: `CHARGEABLE`.

Essa cautela ainda conta para a validade enquanto não for totalmente encerrada.

### Devolução parcial

Parte dos itens foi devolvida, mas ainda existe item pendente.

Status técnico: `PARTIAL_RETURN`.

Essa cautela ainda conta para a validade, pois não foi totalmente encerrada.

### Devolução total

Todos os itens da cautela foram devolvidos.

Status técnico: `SETTLED_RETURN`.

Essa cautela não conta para a validade.

### Baixa financeira

A cautela foi encerrada por baixa financeira.

Status técnico: `SETTLED_DISCOUNT`.

Essa cautela não conta para a validade.

## O que significa "Em aberto"?

O filtro **Em aberto** agrupa todas as cautelas que ainda não foram totalmente encerradas.

Entram em **Em aberto**:

- Retirada sem devolução.
- Extra.
- Com cobrança.
- Devolução parcial.

Não entram em **Em aberto**:

- Devolução total.
- Baixa financeira.

## O que aparece no Dashboard?

O card **Validade de Cautelas** mostra colaboradores por prazo de validade da última cautela considerada.

Ele não mostra:

- quantidade de itens;
- quantidade de linhas do relatório;
- quantidade de retiradas em aberto.

Ele mostra colaboradores, considerando a última cautela válida de cada um.

## Quais cautelas contam para o Dashboard?

Contam para o Dashboard apenas cautelas ainda não encerradas.

Entram no Dashboard:

- Retirada sem devolução.
- Extra.
- Com cobrança.
- Devolução parcial.
- Cautelas históricas importadas, quando não houver cautela mais recente no sistema.

Não entram no Dashboard:

- Devolução total.
- Baixa financeira.

## Como são calculadas as faixas do Dashboard?

Para cada colaborador, o sistema identifica a última cautela válida.

A partir dessa data, soma 6 meses para definir o vencimento.

As faixas exibidas são:

- **Vencidas**: cautelas cuja validade já passou.
- **Até 30 dias**: cautelas que vencem em até 30 dias.
- **31 a 89 dias**: cautelas que vencem entre 31 e 89 dias.
- **90 dias ou mais**: cautelas com vencimento em 90 dias ou mais.

## Exemplo prático

Se um colaborador retirou camisa e calça na mesma cautela, o relatório pode mostrar 2 linhas.

Mas no Dashboard isso conta como 1 colaborador com cautela válida.

Se essa cautela foi totalmente devolvida, ela deixa de contar para o Dashboard.

## Resumo para tomada de decisão

Use o relatório para analisar detalhes da retirada e dos itens.

Use o Dashboard para acompanhar a validade da última cautela ativa de cada colaborador.

Se precisar saber quem está próximo do vencimento, use o card **Validade de Cautelas**.

Se precisar saber exatamente quais itens foram retirados ou devolvidos, use o relatório de retiradas.

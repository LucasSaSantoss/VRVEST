# Plano Técnico - Módulo de Controle de Enxoval

## Objetivo

Definir como deve funcionar o módulo de controle de enxoval, considerando a realidade operacional da rouparia, a necessidade de controle por peça e a dependência de registros manuais de recebimento.

Este documento substitui a versão inicial baseada em "kit fechado", requisição online obrigatória e confirmação digital nos andares.

## Histórico da Revisão

<!-- [MANUTENCAO] Motivo: revisar o plano do módulo de enxoval após novas informações operacionais sobre peças avulsas, saída matinal e recebimento manual.
     [MANUTENCAO] Impacto: MVP passa a priorizar controle por peça, modelos de envio por andar e rastreabilidade do recebimento manual.
     [MANUTENCAO] Data: 2026-06-12
     [MANUTENCAO] Autor: Márlon Etiene -->

O planejamento anterior considerava parte do enxoval como um fluxo próximo de requisição/kit. Isso não representa bem a operação.

Nova diretriz:

1. enxoval deve ser tratado por peças separadas;
2. saída diária matinal pode ser baseada em modelo pré-cadastrado por andar, se isso for confirmado com a operação;
3. recebimento será manual e dependerá de atualização posterior no sistema;
4. o sistema deve reduzir erro operacional e dar rastreabilidade, mas não pode presumir confirmação online em tempo real nos andares.

## Situação Confirmada

1. O enxoval não é um kit fechado.
2. O controle deve ser por peça, como lençol, cobertor, fronha, toalha ou outro item definido pela rouparia.
3. O estoque deve ser controlado por item de enxoval.
4. Não há garantia de internet ou terminal disponível nos andares para confirmação online.
5. O recebimento tende a continuar dependendo de processo manual.
6. Já existe preocupação operacional com apontamento correto de quem recebeu.
7. O sistema precisa registrar quem liberou, quem recebeu, quando recebeu, o que foi enviado e eventuais divergências.

## Pontos Pendentes de Validação com a Operação

1. Confirmar se a saída diária matinal é pré-programada por andar.
2. Confirmar se cada andar recebe sempre a mesma composição de peças.
3. Confirmar se há variação por dia da semana, ocupação ou demanda.
4. Confirmar se existe reposição complementar ao longo do dia.
5. Confirmar quais dados são anotados hoje no livro físico.
6. Confirmar se o recebedor sempre informa CPF ou apenas nome/matrícula.
7. Confirmar quem será responsável por atualizar o sistema após o recebimento manual.

## Princípios do Módulo

1. Controlar peças, não kits.
2. Facilitar a rotina diária da rouparia.
3. Permitir edição antes da liberação do lote.
4. Registrar divergências sem travar a operação.
5. Manter trilha de auditoria forte.
6. Não exigir infraestrutura inexistente nos andares.
7. Deixar claro o que está confirmado e o que está pendente.

## Conceitos Principais

### Peça de Enxoval

É cada item controlado individualmente.

Exemplos:

1. lençol;
2. cobertor;
3. fronha;
4. toalha;
5. campo cirúrgico, se aplicável;
6. outros itens definidos pela rouparia.

### Lote de Envio

É o conjunto de peças enviado em uma saída.

Um lote pode ser:

1. envio diário matinal para um andar;
2. envio complementar;
3. retirada avulsa na rouparia.

### Modelo de Envio por Andar

É uma configuração pré-cadastrada com as peças e quantidades normalmente enviadas para um andar.

Esse modelo só deve ser usado se a operação confirmar que a saída matinal é previsível.

### Confirmação Manual de Recebimento

É o registro posterior, no sistema, das informações de quem recebeu e se houve divergência.

Essa confirmação pode ser feita com base no livro físico ou em outro controle manual validado pela rouparia.

## Fluxo Principal Proposto - Saída Diária Matinal

### Cenário A - Saída Matinal Pré-Programada

Se a rotina for pré-programada por andar, o sistema deve permitir cadastrar modelos.

Passo a passo:

1. Supervisor ou administrador cadastra os andares.
2. Para cada andar, cadastra o modelo padrão de envio.
3. Na rotina diária, operador seleciona "Gerar saída matinal".
4. Sistema cria lotes pendentes com base nos modelos cadastrados.
5. Operador confere cada lote.
6. Operador pode editar quantidades ou remover/adicionar peças antes de liberar.
7. Operador informa quem está liberando.
8. Sistema registra a saída e baixa estoque.
9. Lote fica aguardando confirmação de recebimento.

Vantagem:

1. reduz digitação diária;
2. padroniza a rotina;
3. permite identificar desvios do padrão.

Cuidados:

1. toda edição do lote deve ser registrada;
2. o sistema deve mostrar o que veio do modelo e o que foi alterado;
3. não deve liberar lote sem estoque suficiente, salvo regra de contingência validada.

### Cenário B - Saída Matinal Não Pré-Programada

Se a rotina não for fixa, o envio deve ser manual.

Passo a passo:

1. Operador seleciona o andar.
2. Operador informa peças e quantidades.
3. Operador confirma a liberação.
4. Sistema registra a saída e baixa estoque.
5. Lote fica aguardando confirmação de recebimento.

Vantagem:

1. reflete melhor variações diárias;
2. evita modelo incorreto.

Cuidados:

1. pode aumentar digitação;
2. pode gerar mais erro operacional;
3. precisa de tela rápida e simples.

## Fluxo de Confirmação de Recebimento

### Objetivo

Registrar quem recebeu o enxoval e confirmar se o recebido bate com o enviado.

### Passo a passo

1. Operador acessa lotes pendentes de confirmação.
2. Localiza o lote por data, andar ou número do envio.
3. Informa dados do recebedor.
4. Informa data/hora do recebimento ou horário aproximado.
5. Informa referência do livro físico, quando aplicável.
6. Confirma se as quantidades batem.
7. Se houver divergência, informa quantidade recebida e observação obrigatória.
8. Sistema finaliza o lote como confirmado ou confirmado com divergência.

### Dados mínimos do recebimento

1. nome do recebedor;
2. CPF ou matrícula, se disponível;
3. andar/setor;
4. data/hora do recebimento;
5. referência do livro ou evidência operacional;
6. usuário que registrou a confirmação no sistema.

## Retirada Avulsa na Rouparia

Esse fluxo deve existir para situações fora da saída diária.

Passo a passo:

1. Operador seleciona "Retirada avulsa".
2. Informa recebedor por CPF, matrícula ou nome.
3. Seleciona peças e quantidades.
4. Confirma liberação.
5. Sistema baixa estoque.
6. Registro fica confirmado no ato, ou pendente se a operação exigir confirmação posterior.

## Controle de Estoque

O estoque deve ser controlado por peça.

Movimentações mínimas:

1. entrada manual;
2. saída por lote diário;
3. saída por retirada avulsa;
4. ajuste manual;
5. cancelamento de saída ainda não confirmada;
6. correção de divergência, se validada pela regra de negócio.

Cada movimentação deve registrar:

1. item;
2. quantidade;
3. tipo da movimentação;
4. origem;
5. usuário;
6. data/hora;
7. observação quando necessário.

## Status Sugeridos

### `RASCUNHO`

Lote criado, mas ainda não liberado.

### `LIBERADO_PENDENTE_RECEBIMENTO`

Lote liberado pela rouparia e aguardando apontamento de recebimento.

### `RECEBIDO_CONFIRMADO`

Recebimento confirmado sem divergência.

### `RECEBIDO_COM_DIVERGENCIA`

Recebimento confirmado com diferença de quantidade ou informação incompleta.

### `CANCELADO`

Lote cancelado antes da finalização.

## Entidades Sugeridas

### `LinenItem`

Cadastro de peças de enxoval.

Campos sugeridos:

1. `id`;
2. `name`;
3. `description`;
4. `active`;
5. `createdAt`;
6. `updatedAt`.

### `LinenFloor`

Cadastro de andares/setores que recebem enxoval.

Campos sugeridos:

1. `id`;
2. `name`;
3. `description`;
4. `active`;
5. `createdAt`;
6. `updatedAt`.

### `LinenFloorDispatchTemplate`

Modelo padrão de envio por andar.

Campos sugeridos:

1. `id`;
2. `linenFloorId`;
3. `name`;
4. `active`;
5. `createdAt`;
6. `updatedAt`.

### `LinenFloorDispatchTemplateItem`

Peças e quantidades do modelo padrão.

Campos sugeridos:

1. `id`;
2. `templateId`;
3. `linenItemId`;
4. `quantity`.

### `LinenDispatch`

Lote de envio ou retirada.

Campos sugeridos:

1. `id`;
2. `dispatchType`;
3. `linenFloorId`;
4. `templateId`;
5. `status`;
6. `releasedAt`;
7. `releasedByUserId`;
8. `receivedAt`;
9. `receiverName`;
10. `receiverDocument`;
11. `bookReference`;
12. `notes`;
13. `createdAt`;
14. `updatedAt`.

### `LinenDispatchItem`

Peças do lote.

Campos sugeridos:

1. `id`;
2. `linenDispatchId`;
3. `linenItemId`;
4. `plannedQuantity`;
5. `releasedQuantity`;
6. `receivedQuantity`;
7. `wasEdited`;
8. `notes`.

### `LinenMovement`

Movimentação de estoque.

Campos sugeridos:

1. `id`;
2. `linenItemId`;
3. `movementType`;
4. `originType`;
5. `referenceId`;
6. `quantity`;
7. `userId`;
8. `notes`;
9. `createdAt`.

## Auditoria Obrigatória

Registrar em `UserLog` ou estrutura equivalente:

1. criação do lote;
2. geração a partir de modelo;
3. edição de quantidades;
4. liberação;
5. confirmação de recebimento;
6. divergência;
7. cancelamento;
8. ajuste de estoque.

Para cada ação, registrar:

1. usuário;
2. data/hora;
3. dados anteriores;
4. dados novos;
5. justificativa quando aplicável.

## Telas Sugeridas para MVP

### Cadastro de Peças

Cadastro de itens como lençol, cobertor e demais peças.

### Cadastro de Andares

Cadastro dos locais que recebem enxoval.

### Modelo de Envio por Andar

Configuração das peças e quantidades padrão por andar.

Essa tela depende da confirmação de que a saída matinal é pré-programada.

### Geração de Saída Matinal

Tela para gerar os lotes do dia a partir dos modelos.

Deve permitir edição antes da liberação.

### Saída Manual

Tela alternativa para montar lote do zero quando não houver modelo.

### Confirmação de Recebimento

Tela para registrar recebedor, referência do livro e divergências.

### Pendências de Recebimento

Lista de lotes liberados que ainda não foram confirmados.

## MVP Recomendado

O MVP deve ser dividido em duas decisões.

### Decisão 1 - Confirmar rotina matinal

Antes de codar o fluxo principal, validar com a rouparia:

1. os andares que recebem enxoval;
2. se há composição padrão por andar;
3. se há variação frequente;
4. quem pode alterar o lote;
5. quem confirma no sistema depois.

### Decisão 2 - Implementar fluxo mínimo

Com a rotina confirmada, implementar:

1. cadastro de peças;
2. cadastro de andares;
3. saída manual por andar;
4. confirmação manual de recebimento;
5. pendências de recebimento;
6. estoque por peça;
7. auditoria.

Se a saída pré-programada for confirmada, incluir também:

1. modelo por andar;
2. geração automática do lote matinal;
3. edição auditada do lote gerado.

## Riscos

### Recebimento não atualizado no sistema

Risco:

O processo depende de pessoas registrando manualmente a confirmação.

Mitigação:

1. painel de pendências por data;
2. destaque para lotes antigos;
3. relatório de pendências por andar;
4. responsabilização por usuário que registrou a confirmação.

### Divergência entre livro e sistema

Risco:

O livro pode estar incompleto ou diferente do que foi enviado.

Mitigação:

1. campo obrigatório de referência do livro;
2. observação obrigatória em divergência;
3. histórico de alterações;
4. relatório de divergências.

### Modelo pré-programado incorreto

Risco:

Se o modelo por andar não refletir a operação real, o sistema pode gerar lotes errados.

Mitigação:

1. permitir edição antes da liberação;
2. registrar alterações;
3. revisar modelos periodicamente;
4. iniciar com saída manual se houver dúvida.

## Fora do Escopo Inicial

1. controle de lavanderia;
2. retorno da lavanderia;
3. integração por BAM;
4. portal de requisição online obrigatório;
5. confirmação online nos andares;
6. substituição total do livro físico.

## Critérios de Aceite do MVP

1. Sistema cadastra peças separadamente.
2. Sistema controla estoque por peça.
3. Operador registra saída de enxoval por andar.
4. Operador pode editar o lote antes da liberação.
5. Sistema registra quem liberou.
6. Sistema permite informar quem recebeu.
7. Sistema permite registrar divergência.
8. Sistema lista pendências de recebimento.
9. Sistema mantém auditoria das ações críticas.
10. Fluxo não depende de internet ou terminal nos andares.

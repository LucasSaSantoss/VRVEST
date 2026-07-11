# Validação Funcional - Recebimento de Enxoval com Apoio do Livro (Fase 1)

## Objetivo do documento

Validar uma operação simples e viável para controle de enxoval, considerando as restrições atuais:

1. Não há terminal disponível nos andares para confirmação online.
2. Não há internet disponível nos andares para uso do sistema.
3. Já existe um livro físico de recebimento na rotina da rouparia.
4. Há diretriz de redução de uso de papel adicional.

A proposta é manter o livro como evidência operacional e registrar no sistema a rastreabilidade mínima necessária.

---

## Cenário operacional atual (confirmado)

1. A rouparia envia enxovais diariamente para os andares, com rotina fixa.
2. A retirada avulsa na rouparia existe, mas é menos frequente.
3. O recebimento no andar é anotado em livro.

---

## Diretriz da Fase 1

Não criar novo comprovante impresso.

A confirmação de recebimento será registrada no sistema com base nas anotações do livro já existente, garantindo:

1. quem solicitou (quando houver solicitação);
2. quem liberou na rouparia;
3. quem recebeu;
4. quando ocorreu;
5. quais itens e quantidades foram movimentados.

---

## Escopo da Fase 1

Inclui:

1. Registro de envio diário por andar (rotina fixa).
2. Registro de retirada avulsa (quando ocorrer).
3. Confirmação posterior no sistema com base no livro.
4. Controle de pendências de confirmação.
5. Auditoria completa das etapas.

Não inclui:

1. Envio para lavanderia.
2. Retorno da lavanderia.
3. Confirmação digital no andar em tempo real.

---

## Perfis envolvidos

1. Operador da rouparia:
   - registra envio diário;
   - registra retirada avulsa;
   - confirma no sistema o recebimento com base no livro;
   - informa divergências.

2. Administrador:
   - acompanha pendências;
   - consulta histórico;
   - audita inconsistências.

3. Solicitante do setor (quando houver fluxo de solicitação):
   - cria solicitação;
   - acompanha atendimento.

---

## Fluxo 1 - Envio diário para andares (sem pedido prévio)

### Passo a passo

1. Rouparia registra no sistema o envio do dia para cada andar.
2. Sistema grava itens e quantidades previstas por andar.
3. Status inicial do envio: `ENVIADO_PENDENTE_CONFIRMACAO`.
4. Recebimento é anotado no livro físico, conforme prática atual.
5. Operador da rouparia realiza confirmação no sistema com base no livro.
6. Status final: `RECEBIDO_CONFIRMADO` ou `RECEBIDO_COM_DIVERGENCIA`.

### Dados obrigatórios na confirmação pelo livro

1. Nome do recebedor.
2. CPF informado do recebedor.
3. Data/hora do recebimento (ou horário aproximado).
4. Referência do livro (página/linha ou identificação equivalente).
5. Observação obrigatória em caso de divergência.

---

## Fluxo 2 - Retirada avulsa na rouparia

### Passo a passo

1. Rouparia registra retirada avulsa no sistema.
2. Recebedor informa CPF no balcão.
3. Sistema localiza colaborador por CPF (quando cadastro existir).
4. Operador confirma a entrega.
5. Registro fica com trilha completa de responsabilidade.

### Regras mínimas

1. Exibir nome e setor antes da confirmação.
2. Bloquear confirmação quando CPF inválido.
3. Registrar observação em qualquer exceção operacional.

---

## Status sugeridos para Fase 1

1. `REGISTRADO`
2. `ENVIADO_PENDENTE_CONFIRMACAO`
3. `RECEBIDO_CONFIRMADO`
4. `RECEBIDO_COM_DIVERGENCIA`
5. `CANCELADO`

Observação:
Os labels exibidos ao usuário devem ser em português brasileiro.

---

## Auditoria obrigatória (todos os fluxos)

Cada ação deve registrar:

1. usuário da ação (operador/admin);
2. data/hora;
3. tipo da ação;
4. itens e quantidades;
5. responsável informado no recebimento (nome/CPF);
6. referência do livro;
7. justificativa quando houver divergência, ajuste ou cancelamento.

---

## Critérios de aceite para validação com usuários

1. Operador consegue registrar envio diário por andar com poucos passos.
2. Operador consegue confirmar recebimento baseado no livro sem complexidade.
3. Sistema mostra claramente o que está pendente de confirmação.
4. É possível auditar qualquer envio: quem enviou, quem recebeu, quando e em que condições.
5. Não há necessidade de novo impresso para operacionalizar o fluxo.

---

## Riscos conhecidos e mitigação

1. Risco: anotação incompleta no livro.
   Mitigação: exigir referência do livro e observação obrigatória em confirmação incompleta.

2. Risco: CPF informado incorretamente.
   Mitigação: validação de CPF, exibição do nome antes de confirmar e confirmação explícita do operador.

3. Risco: atraso na confirmação digital.
   Mitigação: painel de pendências por data/andar.

---

## Decisão proposta para Fase 1

Adotar controle híbrido operacional:

1. Livro físico permanece como evidência primária de campo.
2. Sistema registra envio, confirmação e auditoria para rastreabilidade mínima confiável.

Essa abordagem atende a realidade atual da operação sem exigir internet ou terminal nos andares.

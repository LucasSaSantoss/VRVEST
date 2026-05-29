# DOCS/PLANO_TECNICO_MODULO_ENXOVAL.md

## Objetivo

Definir a proposta técnica inicial para o módulo de gestão de enxovais, com foco em manutenção incremental, rastreabilidade e aderência operacional ao contexto hospitalar.

## Contexto Funcional

- O módulo de enxoval é interno (hospital/rouparia/enfermarias).
- Fluxo principal: requisição -> separação -> entrega -> recebimento formal.
- Requisição deve usar BAM para recuperar dados do paciente via API Vitai/Timed.
- Não há Wi-Fi nos andares, porém há terminais com internet.

## Diretrizes de Arquitetura

1. Reaproveitar padrões já consolidados no módulo de uniformes:
   - autenticação JWT;
   - controle por perfil (`User.level`);
   - trilha de auditoria (`UserLog`);
   - histórico de movimentações;
   - mensagens operacionais em português brasileiro.
2. Separar módulos por contexto operacional para reduzir confusão de uso.
3. Manter mudanças incrementais e reversíveis.

## Proposta de Módulos (Fase 1)

### 1) Portal de Requisição de Enxoval (sem menu)

- Rota dedicada, sem entrada no sidebar principal.
- Exige autenticação.
- Interface responsiva (prioridade para terminais e mobile eventual).
- Fluxo:
  1. informar BAM;
  2. buscar paciente na API externa;
  3. selecionar itens/quantidades;
  4. enviar requisição à rouparia.

### 2) Painel de Atendimento da Rouparia

- Nova área no sistema principal.
- Exibir fila de solicitações com status:
  - `NOVA`
  - `EM_SEPARACAO`
  - `PRONTA_PARA_ENTREGA`
  - `ENTREGUE`
  - `CANCELADA`
- Ações:
  - assumir atendimento;
  - confirmar separação;
  - confirmar entrega;
  - visualizar histórico da solicitação.

### 3) Recebimento Formal (sem papel)

- Após entrega, enfermaria confirma recebimento no terminal.
- Confirmação via:
  - BAM;
  - código de entrega (curto);
  - usuário autenticado.
- Resultado:
  - confirmação formal de recebimento;
  - substituição de canhoto físico;
  - trilha auditável.

## Estoque de Enxoval

### Escopo inicial

- Entrada de estoque.
- Saída por requisição.
- Devolução para estoque.
- Ajuste manual.
- Descarte.
- Histórico de movimentações.

### Observação

- Pode compartilhar estratégia de estoque unificado com uniformes, mas com entidades e regras separadas por domínio.

## Integração Vitai/Timed (BAM)

### Requisitos mínimos

1. Endpoint de consulta por BAM com timeout controlado.
2. Tratamento de indisponibilidade da API externa.
3. Fallback operacional:
   - permitir requisição com BAM + dados mínimos quando integração falhar;
   - marcar registro com flag de "dados não validados na integração".
4. Log de erro de integração em `UserLog`.

## Proposta de Entidades (alto nível)

1. `LinenItem`
   - catálogo de peças/kits de enxoval.
2. `LinenStock`
   - saldo por item/local.
3. `LinenRequest`
   - requisição principal (BAM, setor solicitante, status).
4. `LinenRequestItem`
   - itens da requisição.
5. `LinenDeliveryReceipt`
   - confirmação formal de recebimento.
6. `LinenMovement`
   - movimentações de estoque do módulo.

## Permissões iniciais sugeridas

1. Enfermaria (solicitante):
   - criar requisição;
   - consultar suas requisições;
   - confirmar recebimento.
2. Rouparia (operador/admin):
   - atender requisições;
   - movimentar estoque;
   - registrar entrega.
3. Admin:
   - parametrizações e relatórios completos.

## Alertas Operacionais

- Ao criar requisição, notificar painel da rouparia imediatamente.
- Enquanto não houver canal em tempo real, começar com polling curto (ex.: 10-15s) no painel da rouparia.
- Evolução futura: WebSocket/SSE para atualização instantânea.

## Fases de Implementação

### Fase 1 (MVP)

1. Cadastro básico de itens de enxoval.
2. Portal de requisição por BAM.
3. Fila da rouparia e mudança de status.
4. Baixa/entrada de estoque por atendimento.
5. Recebimento formal por código de entrega.
6. Auditoria completa em `UserLog`.

### Fase 2

1. Relatórios operacionais:
   - tempo médio de atendimento;
   - itens mais solicitados;
   - pendências por setor.
2. Integração robusta com API externa (retries e observabilidade).
3. Notificações por e-mail (solicitante + rouparia) quando aplicável.
4. Melhorias de UX para terminais de andares.

### Fase 3

1. Unificação de visão de estoque (uniformes + enxoval) com segregação por domínio.
2. Regras avançadas por setor/perfil.
3. Painéis gerenciais.

## Riscos e Cuidados

1. Dependência de API externa por BAM pode impactar fluxo operacional.
2. Controle de estoque sem confirmação formal de recebimento gera divergência.
3. Misturar fluxo de enxoval com uniforme sem separação aumenta risco de erro humano.
4. Mudanças de status devem ser auditadas em todas as transições.

## Critérios de Aceite do MVP

1. Requisição criada com BAM e itens.
2. Rouparia recebe e atende requisição com atualização de status.
3. Entrega gera código para recebimento formal.
4. Enfermaria confirma recebimento no terminal.
5. Estoque é movimentado corretamente.
6. Logs permitem rastrear quem solicitou, atendeu, entregou e confirmou.

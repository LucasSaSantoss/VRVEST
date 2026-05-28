# CONVENTIONS.md

## Objetivo

Registrar padrões observados no projeto para manutenção incremental com menor risco.

## 1) Padrões de Código Observados

### Confirmado no código

- Backend em JavaScript ESM (`import/export`).
- Frontend em React com componentes funcionais e hooks.
- Camada de API no frontend majoritariamente em `src/services/api.jsx`, com exceções em componentes específicos.
- Controllers backend acessam Prisma diretamente.
- Uso de `UserLog` para auditoria em operações críticas.

### Regra obrigatória de evolução incremental

1. Criar novas funcionalidades em arquivos separados sempre que tecnicamente viável.
2. Evitar misturar implementação nova com refatoração ampla em arquivos críticos existentes.
3. Se for inevitável alterar arquivo/script existente, comentar o trecho alterado com anotação clara de manutenção.
4. A anotação deve indicar:
   - objetivo da alteração;
   - impacto esperado no fluxo;
   - data da alteração.
5. O template oficial está em `PADRAO_COMENTARIOS_MANUTENCAO.md`.
6. Em modelagem nova, seguir normalização: com FK definida, não replicar campos já existentes na entidade de origem.

## 2) Convenções de Nomes

### Confirmado no código

- Pastas frontend:
  - `Pages` para telas.
  - `Components` para blocos reutilizáveis/domínio.
  - `services` para integração HTTP.
- Pastas backend:
  - `routes` para endpoints.
  - `controllers` para regras + persistência.
  - `middlewares` para autenticação.

## 3) Organização de Módulos de Uniformes

### Confirmado no código

- Módulos separados no frontend:
  - retirada de uniformes;
  - devolução de uniformes;
  - empréstimo de uniformes;
  - devolução de empréstimos;
  - baixa de uniformes - DP;
  - cadastro de uniformes;
  - estoque de uniformes.

### Diretriz de manutenção

- Preservar separação por contexto operacional para reduzir confusão do usuário final.

## 4) Padrão de Notificações por E-mail

### Confirmado no código

1. Operações com notificação:
   - retirada de uniformes;
   - devolução de uniformes (normal e legada);
   - empréstimo de uniformes;
   - devolução de empréstimos.
2. Destinatários:
   - e-mail do colaborador (quando existir);
   - `EMAIL_COPIADO`.
3. Retorno de API:
   - sempre que aplicável, incluir `emailNotification` para feedback operacional.
4. Erros de e-mail:
   - não bloqueiam a operação principal;
   - devem ser logados em `UserLog`.

## 5) Padrão de Relatórios

### Confirmado no código

1. Relatório de retiradas de uniformes.
2. Relatório de empréstimos de uniformes.
3. Ambos com:
   - filtros por CPF/ano/status;
   - detalhamento por item;
   - exportação para Excel (`.xlsx`).

## 6) Como Criar/Alterar Componentes React com Segurança

1. Confirmar primeiro se o endpoint já é consumido em `src/services/api.jsx` ou diretamente no componente.
2. Reutilizar padrão de retorno `{ success, message, data }`.
3. Preservar mensagens em português brasileiro.
4. Evitar mover regra de negócio do backend para o frontend.
5. Validar impacto por nível de usuário em `Dashboard.jsx`.

## 7) Como Criar/Alterar Rotas no Node com Segurança

1. Criar endpoint em `API/routes/<dominio>Routes.js`.
2. Implementar regra em `API/controllers/<dominio>Controller.js`.
3. Aplicar `authMiddleware` quando necessário.
4. Registrar `UserLog` em operações críticas.
5. Atualizar consumo no frontend.

## 8) Mensagens de Erro e Textos

1. Mensagens de erro devem estar em português brasileiro.
2. Evitar mensagens genéricas quando houver causa conhecida.
3. Garantir encoding UTF-8 para evitar problemas de acentuação.

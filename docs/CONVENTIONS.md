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
  - estoque de uniformes;
  - cautelas legadas de uniformes.

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
4. Cautelas legadas:
   - leitura de planilha no frontend com `xlsx`;
   - validação e persistência no backend;
   - rejeitos retornados para exportação;
   - sem criação de retirada oficial ou movimentação de estoque.

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

## 8) Importações Legadas

1. Não inserir dados legados diretamente em tabelas transacionais oficiais quando faltarem informações críticas.
2. Usar tabela separada de baseline quando o dado for apenas referência histórica.
3. Quando houver `employeeId`, não duplicar nome, CPF ou matrícula como dado de negócio.
4. CPF de planilha deve ser normalizado removendo caracteres não numéricos e preenchendo zeros à esquerda até 11 dígitos.
5. Matrícula deve ser fallback ou validação de conflito, não chave principal quando CPF válido existir.
6. Rejeitos de importação devem retornar para exportação/correção, sem gravação obrigatória em `UserLog`.
7. Criar/alterar registros persistidos deve gerar `UserLog`.

## 9) Mensagens de Erro e Textos

1. Mensagens de erro devem estar em português brasileiro.
2. Evitar mensagens genéricas quando houver causa conhecida.
3. Garantir encoding UTF-8 para evitar problemas de acentuação.

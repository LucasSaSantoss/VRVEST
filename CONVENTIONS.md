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

### Inferido

- Não existe padrão estrito formalizado em lint/arquitetura para separação de serviços de domínio no backend.

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
- Rotas:
  - base `/api` com subprefixos por contexto (`/empl`, `/pend`, `/items`, etc.).

### Validar com equipe

- Se há convenção oficial para idioma de nomes (há mistura de português e inglês).

## 3) Organização de Pastas

### Confirmado no código

- Frontend e backend no mesmo repositório.
- Backend isolado em `API/`.
- Prisma e schema em `API/prisma/`.

### Paralelo Laravel/Vue

- `API/routes` + `API/controllers` ~= `routes/api.php` + controllers Laravel.
- `src/Pages`/`src/Components` ~= páginas e componentes Vue.

## 4) Como Criar/Alterar Componentes React com Segurança

1. Confirmar primeiro se o endpoint já é consumido em `src/services/api.jsx` ou diretamente em algum componente.
2. Reutilizar padrão de tratamento de retorno `{ success, message, data }`.
3. Preservar mensagens em português brasileiro.
4. Evitar mover regra de negócio do backend para o frontend.
5. Validar impacto por nível de usuário em `Dashboard.jsx`.

## 5) Como Criar/Alterar Rotas ou Serviços no Node

1. Criar endpoint em `API/routes/<dominio>Routes.js`.
2. Implementar regra em `API/controllers/<dominio>Controller.js`.
3. Montar rota em `API/server.js` (se novo prefixo).
4. Aplicar `authMiddleware` quando necessário.
5. Registrar `UserLog` em operações críticas.
6. Atualizar consumo no `src/services/api.jsx`.

## 6) Como Lidar com Validações

### Confirmado no código

- Validações de entrada ocorrem majoritariamente nos controllers.
- Há validação de e-mail (`validator` ou regex) em fluxos de usuário/colaborador.
- CPF duplicado é barrado por regra + constraint de banco (`@unique`).

### Recomendação incremental (sem refatoração ampla)

- Manter validações próximas do endpoint alterado.
- Não alterar semântica de mensagens de erro sem necessidade.

## 7) Como Lidar com Mensagens de Erro

### Confirmado no código

- Backend retorna objetos com `success` e `message` em muitos endpoints.
- Frontend exibe popups/mensagens com base nesse retorno.

### Convenção recomendada

1. Manter mensagens claras em português brasileiro.
2. Evitar mensagens genéricas quando houver causa conhecida.
3. Preservar códigos HTTP coerentes (`400`, `401`, `404`, `500`).

## 8) Pontos Sensíveis de Convenção

### Confirmado no código

- Há inconsistência de encoding de acentos em alguns arquivos.
- Existe código legado não integrado no fluxo principal.

### Ação segura

- Em novas mudanças, garantir arquivos em UTF-8 e revisar textos visíveis.

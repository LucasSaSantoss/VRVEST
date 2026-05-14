# ARCHITECTURE.md

## Estrutura Geral do Projeto

### Confirmado no código

- Monorepo com frontend React na raiz e backend Node/Express em `API/`.
- Frontend:
  - Entrada em `src/main.jsx`.
  - Rotas em `src/Pages/App.jsx`.
  - Serviço HTTP principal em `src/services/api.jsx`.
- Backend:
  - Entrada em `API/server.js`.
  - Rotas em `API/routes`.
  - Controllers em `API/controllers`.
  - Middleware JWT em `API/middlewares/authMiddleware.js`.
  - ORM Prisma em `API/prisma/schema.prisma`.

### Inferido

- Organização em camadas simples (`routes -> controllers -> Prisma`).

### Validar com equipe

- Se existe padrão arquitetural formal (ex.: DDD/Clean) além da organização atual.

## Separação entre Backend e Frontend

### Confirmado no código

- Frontend usa Vite + React.
- Backend roda na porta 3000 (`app.listen(3000)`).
- Front consome backend com `VITE_API_URL`.

### Paralelo Laravel/Vue

- Equivale a SPA Vue consumindo API Laravel separada.

## Frameworks e Bibliotecas

### Confirmado no código

- Backend: `express`, `@prisma/client`, `jsonwebtoken`, `bcrypt`, `multer`, `nodemailer`, `node-cron`.
- Frontend: `react`, `react-router-dom`, `axios`, `jwt-decode`, `tailwindcss`, `chart.js`.

### Inferido

- Existe trilha de fila de e-mail (`bullmq`/`ioredis`), porém o fluxo ativo principal usa envio direto (`nodemailer`).

## Organização das Rotas

### Confirmado no código (`API/server.js`)

- `/api` -> `userRoutes`
- `/api/empl` -> `employeeRoutes` (com `authMiddleware` aplicado no mount)
- `/api/pend` -> `pendencyRoutes`
- `/api/email` -> `emailRoutes`
- `/api/sec` -> `sectorRoutes`
- `/api/mod` -> `modalityRoutes`
- `/api/spe` -> `specialtyRoutes`
- `/api/items` -> `itemsRoutes`
- `/api/log` -> `logRoutes`

### Ponto sensível confirmado

- Em `employeeRoutes` há rotas sem `authMiddleware` local, mas o mount de `/api/empl` já protege todas.

## Como o Frontend Consome o Backend

### Confirmado no código

- A maior parte das chamadas está em `src/services/api.jsx`.
- Existem chamadas HTTP diretas em componentes específicos (ex.: `src/Components/BaixaFinanc/BaixaFinanceira.jsx`).
- JWT salvo no `localStorage` (`token`).
- Envio de `Authorization: Bearer <token>` em operações protegidas.
- Interceptor de `401` remove token e redireciona para login.

### Paralelo Laravel/Vue

- `src/services/api.jsx` funciona como um serviço Axios central (similar a plugin/composable em Vue).

## Acesso ao Banco de Dados

### Confirmado no código

- Prisma com provider MySQL.
- Conexão por `DATABASE_URL`.
- Entidades principais: `User`, `Employee`, `Pendency`, `UserLog`.

### Inferido

- Não há camada de repositório separada; controllers acessam Prisma diretamente.

## Autenticação e Autorização

### Confirmado no código

- Login em `POST /api/login` (`userController.loginUser`):
  - valida usuário por e-mail;
  - compara senha com `bcrypt.compare`;
  - verifica `active`;
  - gera JWT com expiração de 5h.
- `authMiddleware` valida token e preenche `req.user`.
- Frontend usa `jwtDecode` para exibir menus por `level`.

### Inferido

- Parte importante da autorização está no frontend (visibilidade de menus), sem matriz backend formal explícita por endpoint.

### Validar com equipe

- Matriz oficial de autorização por endpoint.

## Riscos Arquiteturais de Manutenção

### Confirmado no código

1. Não há testes automatizados configurados.
2. Há arquivos legados aparentes:
   - `API/routes/login.js` (fora do fluxo principal).
   - `src/routes/PrivateRoutes.js` (comentado/sem uso).
3. Há inconsistências de encoding em textos exibidos.
4. Existem ajustes manuais de horário (`-3h`) em múltiplos pontos.
5. Há endpoints potencialmente sensíveis sem `authMiddleware` explícito em `userRoutes` (ex.: `GET /api/users` e `PUT /api/passchange/:id`).

### Inferido

- Alterações em retirada/devolução têm alto risco de regressão funcional sem cobertura de testes.

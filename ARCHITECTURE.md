# ARCHITECTURE.md

## Estrutura Geral

- Frontend React na raiz (`src/`).
- Backend Node/Express em `API/`.
- Banco MySQL acessado via Prisma (`API/prisma/schema.prisma`).

## Backend

- Entrada: `API/server.js`.
- Rotas: `API/routes/*`.
- Controllers: `API/controllers/*`.
- Auth JWT: `API/middlewares/authMiddleware.js`.

### Rotas relevantes de uniformes

- `/api/uniforms/*` (retirada/devolução, configurações e baixa DP).
- `/api/uniform-stock/*` (estoque e movimentações).
- `/api/items/*` (cadastro de itens/uniformes).

## Frontend

- Entrada: `src/main.jsx`.
- Roteamento principal: `src/Pages/App.jsx`.
- Shell e menus por perfil: `src/Pages/Dashboard.jsx`.
- Serviços HTTP: `src/services/api.jsx`.

### Componentes principais de uniformes

- `src/Components/Uniformes/EntradaEstoqueUniformes.jsx`
- `src/Components/Uniformes/RetiradaUniformes.jsx`
- `src/Components/Uniformes/DevolucaoUniformes.jsx`
- `src/Components/Uniformes/EmprestimoUniformes.jsx`
- `src/Components/Uniformes/CadastroUniformes.jsx`
- `src/Components/Uniformes/BaixaDpUniformes.jsx`

### Endpoints adicionais de empréstimos

- `GET /api/uniforms/loan/stock-options`
- `GET /api/uniforms/loan/employee/:cpf/summary`
- `POST /api/uniforms/loan/withdraw`
- `POST /api/uniforms/loan/:id/return`

## Autenticação e Autorização (estado atual)

1. `level = 4` (Admin):
   - estoque de uniformes;
   - cadastro de uniformes;
   - retirada/devolução;
   - baixa DP.
2. `level = 3` (Operador):
   - retirada/devolução.
3. `level = 2` (RH/DP):
   - baixa DP.
4. `level = 1`:
   - acesso básico legado.

## Reforços de Segurança

- Backend de estoque (`uniformStockController`) exige admin.
- Backend de baixa DP (`uniformController`) exige RH ou admin.
- Frontend bloqueia acesso por menu e por query `?tab=` sem permissão.

## Observações de Manutenção

- Não confiar apenas na visibilidade de menu; manter validação no backend.
- Em base legada, sanear datas inválidas (`0000-00-00`) antes de consultas Prisma.
- Devolução legada de uniformes (passivo pré-sistema) está documentada como proposta funcional e ainda não implementada.

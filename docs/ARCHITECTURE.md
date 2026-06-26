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

- `/api/uniforms/*` (retirada, devolução, devolução legada, configurações, baixa DP, relatórios).
- `/api/uniform-stock/*` (estoque e movimentações).
- `/api/items/*` (cadastro de itens/uniformes).

### Endpoints relevantes (uniformes)

- `GET /api/uniforms/employee/:cpf/summary`
- `POST /api/uniforms/withdraw`
- `POST /api/uniforms/withdrawals/:id/return`
- `POST /api/uniforms/returns/legacy`
- `GET /api/uniforms/dp/employee/:cpf/pendencies`
- `PUT /api/uniforms/withdrawals/:id/settlement`
- `GET /api/uniforms/loan/stock-options`
- `GET /api/uniforms/loan/employee/:cpf/summary`
- `POST /api/uniforms/loan/withdraw`
- `POST /api/uniforms/loan/:id/return`
- `GET /api/uniforms/withdrawals`
- `GET /api/uniforms/loans`
- `GET /api/uniforms/legacy-baselines/alerts`
- `GET /api/uniforms/withdrawals/retroactive`
- `GET /api/uniforms/withdrawals/open-validity-summary`
- `POST /api/uniforms/withdraw/retroactive`

## Frontend

- Entrada: `src/main.jsx`.
- Roteamento principal: `src/Pages/App.jsx`.
- Shell e menus por perfil: `src/Pages/Dashboard.jsx`.
- Serviços HTTP: `src/services/api.jsx`.

### Componentes principais de uniformes

- `src/Components/Uniformes/EntradaEstoqueUniformes.jsx`
- `src/Components/Uniformes/CadastroUniformes.jsx`
- `src/Components/Uniformes/CautelasLegadasUniformes.jsx` (consulta de retiradas anteriores)
- `src/Components/Uniformes/RetiradaUniformes.jsx`
- `src/Components/Uniformes/RetiradaRetroativaUniformes.jsx`
- `src/Components/Uniformes/DevolucaoUniformes.jsx`
- `src/Components/Uniformes/EmprestimoUniformes.jsx`
- `src/Components/Uniformes/DevolucaoEmprestimos.jsx`
- `src/Components/Uniformes/BaixaDpUniformes.jsx`

### Relatórios implementados

- `src/Components/Relatorios/RelatorioRetiradasUniformes.jsx`
- `src/Components/Relatorios/RelatorioEmprestimosUniformes.jsx`
- `src/Components/Relatorios/RelatorioVencimentosUniformes.jsx`
- `src/Components/Relatorios/RelatorioEstoqueUniformes.jsx`

## Autenticação e Autorização (estado atual)

1. `level = 4` (Supervisor):
   - acesso a todos os módulos de uniformes.
2. `level = 3` (DP):
   - baixa de uniformes - DP.
3. `level = 2` (Controlador):
   - cadastro, estoque e relatório de estoque para controlador/supervisor; consulta de cautelas legadas para todos os perfis autenticados.
4. `level = 1` (Operador):
   - retirada, devolução, empréstimo e devolução de empréstimos.

## Notificações de E-mail (arquitetura de fluxo)

1. Disparo no backend (`uniformController`) após transação principal concluída.
2. Destinatários:
   - colaborador (quando houver e-mail cadastrado);
   - endereço institucional (`EMAIL_COPIADO`).
3. Retorno para frontend via campo `emailNotification`.
4. Falhas de e-mail são logadas em `UserLog`.

## Reforços de Segurança

- Backend de estoque (`uniformStockController`) exige controlador ou supervisor.
- Backend de cautelas históricas (`uniformLegacyBaselineController`) mantém apenas consulta para dados já existentes; a importação por planilha foi substituída por registro manual de retirada anterior.
- Backend de registro de retirada anterior (`POST /api/uniforms/withdraw/retroactive`) exige supervisor.
- Backend de consulta de retirada anterior (`GET /api/uniforms/withdrawals/retroactive`) lista apenas registros `RETROACTIVE_WITHDRAWAL`.
- Backend de validade de cautelas abertas (`GET /api/uniforms/withdrawals/open-validity-summary`) alimenta o dashboard sem usar planilha.
- Backend de baixa DP (`uniformController`) exige DP ou supervisor.
- Backend de fluxos operacionais exige operador ou supervisor.
- Frontend bloqueia acesso por menu e por query `?tab=` sem permissão.

## Observações de Manutenção

- Não confiar apenas na visibilidade de menu; manter validação no backend.
- Em base legada, sanear datas inválidas (`0000-00-00`) antes de consultas Prisma.
- Garantir textos de interface em português brasileiro.

# DATA_FLOW.md

## Objetivo

Mapear o fluxo de dados nas operações principais, com foco em manutenção segura.

## 1) Fluxo: Login

### Confirmado no código

1. Componente React: `src/Pages/LoginVR.jsx`.
2. Serviço frontend: `loginUsuario` em `src/services/api.jsx`.
3. Endpoint: `POST /api/login`.
4. Backend (`userController.loginUser`):
   - busca usuário por e-mail;
   - valida senha;
   - valida `active`;
   - gera JWT com `id`, `name`, `email`, `sector`, `position`, `level`.
5. Frontend salva `token` no `localStorage`.
6. `Dashboard.jsx` decodifica JWT e define menus por nível.

### Inferido

- JWT é a principal fonte de contexto de sessão no frontend.

## 2) Fluxo: Retirada de Pijama

### Confirmado no código

1. Componente React (módulo QR/retirada) chama `registrarKit` em `src/services/api.jsx`.
2. Endpoint: `POST /api/empl/registrarKit`.
3. Backend (`employeeController.registrarKit`):
   - valida colaborador por CPF (`Employee`);
   - busca valor de item em `itemsCloth` (ID 1);
   - cria `Pendency` com:
     - `status = 1` (aberta),
     - `devolType = 1`,
     - `kitSize`, `kitType`, `kitPrice`;
   - grava `UserLog`;
   - envia e-mail de retirada.
4. Resposta retorna `pendencia` e `funcionario`.

### Inferido

- Cada retirada gera um novo registro de pendência.

### Validar com usuários

- Se pode haver múltiplos kits por uma única retirada operacional.

## 3) Fluxo: Consulta de Pendências Abertas

### Confirmado no código

1. Serviço frontend: `getOpenPendencies({ cpf })`.
2. Endpoint: `POST /api/empl/pendencias`.
3. Backend (`employeeController.getOpenPendencies`):
   - localiza colaborador por CPF;
   - busca `Pendency` com `status = 1`;
   - retorna lista ordenada por data.

### Inferido

- Esse fluxo é o mecanismo atual para alertar pendências antes de nova retirada.

## 4) Fluxo: Devolução de Pijama

### Confirmado no código

1. Serviço frontend: `devolucaoKit({ cpf, id })`.
2. Endpoint: `POST /api/empl/devolver`.
3. Backend (`employeeController.devolverKit`):
   - valida colaborador por CPF;
   - valida pendência por ID;
   - valida vínculo pendência-colaborador;
   - atualiza pendência para:
     - `status = 2`,
     - `devolType = 2`,
     - `devolDate`, `devolUserId`, `devolUserName`;
   - grava `UserLog`;
   - envia e-mail de devolução.

### Validar com usuários

- Se existe cenário de devolução parcial e como deveria ser representado.

## 5) Fluxo: Baixa Financeira

### Confirmado no código

1. Serviço frontend: `carregarPendencias` e ação de baixa (componentes de baixa financeira).
2. Endpoints:
   - `GET /api/pend` (listar registros com filtro de data);
   - `PUT /api/pend/baixar` (baixar pendência por ID).
3. Backend (`pendencyController.baixarPendencias`):
   - atualiza pendência para `status = 2`, `devolType = 3`;
   - grava log;
   - envia e-mail se `usuario.level >= 4`.

## 6) Componentes React Envolvidos (Identificados)

### Confirmado no código

- `src/Pages/LoginVR.jsx`
- `src/Pages/Dashboard.jsx`
- `src/Components/QrCodeVRVest.jsx`
- `src/Components/BaixaFinanc/BaixaFinanceira.jsx`
- `src/Components/DashboardComponents/DashboardScreen.jsx`
- `src/Components/FormFuncionarios/*`
- `src/Components/FormUsuarios/*`

### Inferido

- `QrCodeVRVest.jsx` centraliza parte importante do fluxo de retirada/devolução por CPF/QR.

## 7) Tabelas Mais Impactadas por Fluxo

### Confirmado no código

- Login/autorização: `User`
- Cadastro de colaborador: `Employee`
- Retirada/devolução/baixa: `Pendency`
- Auditoria: `UserLog`
- Preço de item: `itemsCloth`

## 8) Riscos de Fluxo (Manutenção)

### Confirmado no código

1. Regras críticas concentradas em controllers extensos.
2. Pouca cobertura automatizada para detectar regressão.
3. Dependência de `localStorage` para sessão.
4. Uso de ajustes manuais de horário em múltiplos pontos.

### Inferido

- Mudanças em `employeeController` têm alto risco de impacto cruzado.

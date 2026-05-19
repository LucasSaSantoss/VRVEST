# AI_CONTEXT.md

## Objetivo do Projeto

Sistema de controle da rouparia hospitalar para:

- cadastro de colaboradores autorizados;
- registro de retirada de pijamas cirúrgicos;
- registro de devolução;
- controle de pendências;
- suporte operacional com auditoria e relatórios.

## Resumo Funcional

O sistema opera com autenticação por usuário interno. Após login, o operador executa fluxos de cadastro, retirada, devolução e baixa financeira. O backend registra eventos e grava dados em MySQL via Prisma.

## Perfis de Usuário Identificados

### Confirmado no código

- Existe campo `level` no modelo `User` e no token JWT.
- A interface (`Dashboard`) exibe menus diferentes por `level`:
  - `level >= 4`: acesso a dashboard, usuários, relatórios e baixa financeira.
  - `level >= 3`: acesso a baixa financeira e relatórios.
  - `level >= 2`: acesso a colaboradores.
  - `level === 1` ou `level >= 4`: acesso ao módulo de QR Code.

### Inferido

- `level` representa hierarquia de permissões entre operador e administrador.

### Validar com usuários

- Nome oficial de cada perfil e matriz completa de permissões.
- Se `level = 5` é reservado/bloqueado (há filtro `level not 5` em listagem).

## Entidades Principais do Domínio

### Confirmado no código (Prisma)

- `User`
- `Employee`
- `Pendency`
- `UserLog`
- `Sectors`
- `Modalities`
- `Specialties`
- `itemsCloth`

### Inferido

- `itemsCloth` representa cadastro de itens/pijamas e valor de referência.

### Validar com usuários

- Se cada registro em `Pendency` equivale a 1 retirada unitária ou lote de itens.

## Fluxos Principais

### Confirmado no código

1. Login:
   - Front chama `POST /api/login`.
   - Backend valida senha com `bcrypt`, verifica `active`, retorna JWT.
2. Retirada:
   - Front chama `POST /api/empl/registrarKit`.
   - Backend cria `Pendency` com `status = 1` e registra log.
3. Devolução:
   - Front chama `POST /api/empl/devolver`.
   - Backend valida pendência e marca `status = 2`, com log.
4. Baixa financeira:
   - Front chama `PUT /api/pend/baixar`.
   - Backend marca `status = 2` com `devolType = 3` e registra log.
5. Consulta de pendências:
   - Front chama `POST /api/empl/pendencias` e recebe pendências abertas.

### Inferido

- O sistema diferencia devolução física direta (`devolType = 2`) e baixa financeira (`devolType = 3`).

### Validar com usuários

- Significado oficial de todos os valores possíveis de `devolType` e `status`.

## Pontos Ainda Incertos

1. Regra exata de bloqueio de nova retirada quando há pendência em aberto.
2. Regra operacional para `kitType` e possíveis tipos de kit.
3. Critério oficial de colaborador ativo/inativo (`active` em `Employee` e `User`).
4. Papel da especialidade (`Specialties.permiteKitTrauma`) no processo real.
5. Se o valor de item (`itemsCloth.itemVal`) é histórico por retirada ou apenas valor corrente.

## Direção Definida para Nova Evolução (Uniformes)

### Confirmado com produto/operação

1. Uniformes usarão os mesmos colaboradores já existentes em `Employee`.
2. Não será utilizado `Pendency` para uniformes.
3. Cadastro base de uniforme poderá reaproveitar `itemsCloth`.
4. Controle de estoque será por tamanho, em estrutura nova.
5. Haverá módulo de entrada de estoque.
6. Uniforme devolvido irá para estoque de empréstimos (não volta direto ao principal).
7. Deve existir operação de descarte de peças.
8. A retirada deve exibir a última retirada do colaborador.
9. Limite anual é condicional:
   - plantonista: 1;
   - diarista: 2.
10. Excedente sem justificativa deve ser marcado como cobrável.
11. Deve existir justificativa para isenção de cobrança por não entrega.

## Paralelos com Laravel/Vue

- `User`, `Employee`, `Pendency` (Prisma) ~= Models Eloquent.
- Controllers Node acumulam lógica que, em Laravel, muitas vezes iria para Service classes.
- `src/services/api.jsx` centraliza HTTP, similar a um serviço/composable no Vue.
- `Dashboard.jsx` concentra controle de sessão e menus, equivalente a layout + guards de rota no Vue Router (aqui feito de forma manual).

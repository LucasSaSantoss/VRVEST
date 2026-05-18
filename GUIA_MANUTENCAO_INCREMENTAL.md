# GUIA_MANUTENCAO_INCREMENTAL.md

## Objetivo

Orientar manutenção incremental com segurança, sem quebrar fluxos críticos da rouparia.

## Fluxo padrão para qualquer mudança

1. Identificar a regra no backend (controller/rota).
2. Ajustar o serviço de API no frontend.
3. Ajustar a tela/componente que consome.
4. Testar ponta a ponta.
5. Atualizar documentação (`BUSINESS_RULES.md`, `DATA_FLOW.md`, `AI_CONTEXT.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`).

## Regra de implementação (obrigatória)

1. Implementações novas devem ser feitas em arquivos separados, sempre que possível.
2. Alterações em arquivos existentes devem ser mínimas e focadas.
3. Sempre comentar os blocos alterados em arquivos existentes para rastrear exatamente o que foi modificado.
4. O comentário deve incluir:
   - motivo da mudança;
   - impacto funcional esperado;
   - data da alteração.

## 1) Alterar regras de retirada

Arquivos principais:

- `API/controllers/employeeController.js` (`registrarKit`)
- `API/routes/employeeRoutes.js` (`POST /registrarKit`)
- `src/services/api.jsx` (`registrarKit`)
- `src/Components/LeitorQrCode.jsx` e `src/Components/QrCodeVRVest.jsx`

Cuidados:

1. Preservar criação de `Pendency` com `status = 1`.
2. Preservar trilha de auditoria (`UserLog`).
3. Validar impacto em e-mail e prazo de devolução.

## 2) Alterar regras de devolução

Arquivos principais:

- `API/controllers/employeeController.js` (`devolverKit`)
- `API/controllers/pendencyController.js` (`baixarPendencias`)
- `API/routes/employeeRoutes.js` (`POST /devolver`)
- `API/routes/pendencyRoutes.js` (`PUT /baixar`)
- `src/services/api.jsx` (`devolucaoKit`, `carregarPendencias`)
- `src/Components/BaixaFinanc/BaixaFinanceira.jsx`

Cuidados:

1. Preservar vínculo pendência-colaborador.
2. Preservar semântica de `status` e `devolType`.
3. Validar consistência no dashboard e relatórios.

## 3) Alterar cadastro de pijamas (itens)

Arquivos principais:

- `API/controllers/itemsControllers.js`
- `API/routes/itemsRoutes.js`
- `API/prisma/schema.prisma` (modelo `itemsCloth`)
- `src/services/api.jsx` (`listarItems`, `alterarItens`)
- `src/Components/ProfileTabs/ItemsInfos.jsx`

Cuidados:

1. Hoje há dependência do item com `id = 1` no fluxo de retirada.
2. Alterações de estrutura impactam retirada, baixa e relatórios.

## 4) Alterar cadastro de funcionários

Arquivos principais:

- `API/controllers/employeeController.js` (`createEmpl`, `updateEmpl`, `importarFuncionarios`, `createTempEmpl`)
- `API/routes/employeeRoutes.js`
- `API/FuncoesAutomaticas/cronJobs.js`
- `API/prisma/schema.prisma` (modelo `Employee`)
- `src/services/api.jsx`
- `src/Components/FormFuncionarios/*`
- `src/Components/FuncionarioTemporario/FuncionarioTemp.jsx`

Cuidados:

1. Preservar unicidade de CPF/e-mail.
2. Preservar regras de colaborador temporário (`tempEmpl`, `tempAlterDate`, `active`).
3. Não quebrar logs de auditoria.

## 5) Alterar permissões de usuários

Arquivos principais:

- `API/controllers/userController.js`
- `API/routes/userRoutes.js`
- `API/middlewares/authMiddleware.js`
- `src/Pages/Dashboard.jsx`
- `src/Components/FormUsuarios/*`

Cuidados:

1. Não depender apenas do frontend para autorização.
2. Revisar endpoints sensíveis sem `authMiddleware` explícito.
3. Validar matriz de permissões por `level` com a operação antes de alterar.

## Checklist mínimo de validação

1. Login continua funcionando.
2. Retirada continua criando pendência.
3. Devolução continua encerrando a pendência correta.
4. Baixa financeira continua consistente.
5. Cadastros (itens, funcionários, usuários) continuam íntegros.
6. Mensagens de interface seguem português brasileiro.

## Referências rápidas

- `AGENTS.md`
- `AI_CONTEXT.md`
- `ARCHITECTURE.md`
- `BUSINESS_RULES.md`
- `DATA_FLOW.md`
- `CONVENTIONS.md`

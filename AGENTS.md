# AGENTS.md

## Objetivo

Definir regras operacionais para qualquer manutenção neste projeto, priorizando segurança, continuidade do negócio e mudanças incrementais.

## Regra de Idioma (Obrigatória)

- Toda documentação, label, texto de interface, mensagens de erro e comentários de negócio devem estar em português brasileiro.
- Deve-se seguir gramática e ortografia do português brasileiro.

## Princípios de Manutenção

1. Não alterar regra de negócio sem validação explícita.
2. Preservar o comportamento atual do sistema por padrão.
3. Aplicar mudanças pequenas, isoladas e reversíveis.
4. Não assumir padrões sem confirmar no código.
5. Sempre registrar claramente o que é:
   - confirmado no código;
   - inferido;
   - pendente de validação com usuários.

## Segurança, Autenticação, Autorização e Auditoria

1. Não remover validações de autenticação JWT existentes.
2. Ao criar/alterar endpoint, avaliar necessidade de `authMiddleware`.
3. Não expor segredos em código (`JWT_SECRET`, credenciais de e-mail, `DATABASE_URL`).
4. Preservar trilha de auditoria (`UserLog`) em fluxos críticos.
5. Não alterar lógica de níveis de usuário sem validação do dono do processo.

## Fluxo Crítico do Negócio (Rouparia)

1. Não quebrar o fluxo de retirada de pijama cirúrgico.
2. Não quebrar o fluxo de devolução de pijama cirúrgico.
3. Não quebrar o tratamento de pendências (aberta, devolvida, baixa financeira).
4. Não alterar regra de bloqueio/alerta de pendência sem validação funcional.

## Padrão de Trabalho para Mudanças

1. Identificar arquivos impactados (backend, frontend, banco).
2. Confirmar contratos de API antes de alterar payload/resposta.
3. Implementar alteração mínima necessária.
4. Executar teste manual do fluxo ponta a ponta.
5. Atualizar documentação correspondente (`AI_CONTEXT.md`, `ARCHITECTURE.md`, `BUSINESS_RULES.md`, `DATA_FLOW.md`, `CONVENTIONS.md`).

## Checklist Mínimo Antes de Entregar Alteração

1. Login continua funcionando.
2. Retirada continua registrando pendência.
3. Devolução continua baixando pendência correta.
4. Perfis/menus por nível continuam coerentes.
5. Mensagens de erro seguem português brasileiro.
6. Não houve alteração involuntária em regras de negócio.

## Paralelo Rápido com Laravel/Vue

- `API/routes/*.js` ~= `routes/api.php`.
- `API/controllers/*.js` ~= controllers Laravel com parte de service embutida.
- `API/middlewares/authMiddleware.js` ~= middleware de auth no Laravel.
- `src/services/api.jsx` ~= camada de serviços HTTP no frontend (similar a services/composables no Vue).

## Limites de Atuação do Agente

- Não executar refatoração ampla sem solicitação.
- Não remover código legado sem confirmar uso real.
- Não alterar permissões de usuário por dedução.
- Não alterar semântica de status de pendência sem validação com área de negócio.

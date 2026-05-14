# BUSINESS_RULES.md

## Objetivo

Documentar regras de negócio do sistema, separando:

- confirmado no código;
- inferido;
- pendente de validação com usuários.

## 1) Regras Confirmadas no Código

1. Login só é aceito com:
   - e-mail existente;
   - senha válida (`bcrypt`);
   - usuário ativo (`user.active === 1`).
2. Na retirada de kit (`registrarKit`):
   - colaborador deve existir por CPF;
   - é criada uma pendência (`Pendency`) com `status = 1`;
   - registra log em `UserLog`;
   - envia e-mail ao colaborador.
3. Na devolução (`devolverKit`):
   - colaborador deve existir;
   - pendência deve existir;
   - pendência deve pertencer ao colaborador informado;
   - atualização para `status = 2` e `devolType = 2`;
   - registra log e envia e-mail.
4. Na baixa financeira (`baixarPendencias`):
   - exige ID da pendência;
   - atualiza para `status = 2` e `devolType = 3`;
   - registra log;
   - envia e-mail condicionalmente (`usuario.level >= 4`).
5. Consulta de pendências abertas (`getOpenPendencies`):
   - filtra por `emplID` e `status = 1`.
6. Colaborador temporário:
   - pode ser criado com foto obrigatória (`createTempEmpl`);
   - há cron de validação que inativa temporários após 36h sem atualização.
7. Controle de acesso de interface:
   - menus e telas exibidos conforme `level` do JWT no `Dashboard`.

## 2) Regras Inferidas a Partir do Contexto + Código

1. Cada retirada gera uma nova pendência até ocorrer devolução ou baixa.
2. `devolType` diferencia origem da baixa:
   - `2`: devolução direta;
   - `3`: baixa financeira.
3. O valor de cobrança de kit é lido do cadastro de item (`itemsCloth`, ID 1).
4. `Specialties.permiteKitTrauma` influencia permissão de tipo de kit trauma.

## 3) Regras que Precisam Ser Validadas com Usuários

1. Se colaborador com pendência em aberto deve ser bloqueado de nova retirada ou apenas alertado.
2. Significado completo de `status` e `devolType` (todos os valores possíveis).
3. Regra oficial de prazo de devolução (36h aparece em mensagens e cálculos).
4. Política de cobrança: quando há desconto, quem autoriza, e qual cálculo oficial.
5. Regra de exceção do CPF específico (`13863000714`) presente no código.
6. Definição funcional de níveis (`level 1,2,3,4,5`) e responsabilidades de cada perfil.

## 4) Fluxo de Retirada de Pijama (Confirmado no Código)

1. Operador autenticado envia CPF e dados do kit.
2. Sistema valida existência do colaborador.
3. Sistema cria pendência com status em aberto.
4. Sistema registra log de auditoria.
5. Sistema envia e-mail com data de retirada e prazo.

## 5) Fluxo de Devolução de Pijama (Confirmado no Código)

1. Operador autenticado envia CPF e ID da pendência.
2. Sistema valida colaborador, pendência e vínculo entre ambos.
3. Sistema marca pendência como devolvida (`status = 2`, `devolType = 2`).
4. Sistema registra log.
5. Sistema envia confirmação por e-mail.

## 6) Tratamento de Pendências

### Confirmado no código

- Pendências abertas são `status = 1`.
- Devolução/baixa fecham pendência com `status = 2`.
- Dashboard classifica como “Em aberto”, “Atrasado” e “Devolvido” com base em tempo e status.

### Inferido

- “Atrasado” ocorre quando pendência aberta ultrapassa 36h.

### Validar com usuários

- Se o critério de atraso de 36h é regra oficial de negócio ou provisório.

## 7) Permissões por Tipo de Usuário

### Confirmado no código (frontend)

- `level >= 4`: mais amplo (dashboard, usuários, relatórios, baixa).
- `level >= 3`: inclui baixa financeira e relatórios.
- `level >= 2`: acesso a colaboradores.
- `level === 1`: acesso a QR Code.

### Inferido

- `level >= 4` aparenta perfil administrativo/supervisor.

### Validar com usuários

- Permissão backend por endpoint ainda precisa de matriz formal validada.

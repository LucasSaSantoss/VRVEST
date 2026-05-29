# CHECKLIST_REGRESSAO_UNIFORMES.md

## Objetivo

Validar manualmente os fluxos críticos dos módulos de uniformes após as implementações de jornada, validade e relatórios.

## Pré-condições

1. Backend e frontend em execução.
2. Usuário administrador disponível.
3. Usuário operador disponível.
4. Usuário RH disponível.
5. Base com ao menos:
   - 2 colaboradores ativos;
   - uniformes e tamanhos cadastrados;
   - saldo em estoque principal e de empréstimos.

## 1. Cadastro de Uniformes (Admin)

- [ ] Criar uniforme com validade plantonista e diarista (1..12).
- [ ] Editar validade de uniforme existente e confirmar persistência.
- [ ] Alterar status ativo/inativo e validar comportamento na retirada.
- [ ] Confirmar labels, mensagens e toasts em pt-BR.

## 2. Configuração de Uniformes (Admin)

- [ ] Salvar limite anual plantonista e diarista.
- [ ] Validar recarregamento dos limites após refresh.
- [ ] Ativar/desativar política de movimentação com estoque zerado/negativo.
- [ ] Confirmar mensagem de sucesso/erro em pt-BR.

## 3. Estoque de Uniformes (Admin)

- [ ] Entrada no estoque principal com NF e quantidade.
- [ ] Ajuste de estoque principal.
- [ ] Ajuste de estoque de empréstimos.
- [ ] Transferência principal -> empréstimos.
- [ ] Descarte com justificativa obrigatória.
- [ ] Histórico de movimentações exibindo dados e justificativas.

## 4. Retirada de Uniformes (Operador/Admin)

- [ ] Buscar colaborador por CPF.
- [ ] Selecionar jornada por rádio (Plantonista/Diarista).
- [ ] Validar limite anual e retiradas no ano conforme jornada.
- [ ] Adicionar item ao carrinho e validar exibição de validade prevista.
- [ ] Confirmar retirada REGULAR (dentro do limite).
- [ ] Confirmar retirada EXTRA (acima do limite com justificativa).
- [ ] Validar bloqueios quando necessário (ex.: sem jornada).
- [ ] Validar card de Última Retirada com validade por item.

## 5. Devolução de Uniformes (Operador/Admin)

- [ ] Buscar colaborador por CPF e listar retiradas pendentes.
- [ ] Confirmar devolução por item (normal).
- [ ] Confirmar devolução legada com justificativa obrigatória.
- [ ] Validar atualização de pendências após devolução.

## 6. Baixa de Uniformes - DP (RH/Admin)

- [ ] Buscar colaborador por CPF e listar pendências.
- [ ] Confirmar baixa financeira por item com quantidade.
- [ ] Validar bloqueio para item já cobrado.
- [ ] Confirmar atualização de status de cobrança na tela.

## 7. Empréstimos de Uniformes (Operador/Admin)

- [ ] Registrar saída de empréstimo.
- [ ] Registrar devolução de empréstimo.
- [ ] Validar que empréstimo não permite saída sem saldo.

## 8. Relatórios (Admin)

### 8.1 Retiradas de Uniformes
- [ ] Filtrar por CPF/ano/status.
- [ ] Exportar Excel e validar colunas.

### 8.2 Empréstimos de Uniformes
- [ ] Filtrar por CPF/ano/status.
- [ ] Exportar Excel e validar colunas.

### 8.3 Vencimentos de Uniformes (Unificado)
- [ ] Filtrar por: Todos, A vencer, 60 dias, 30 dias, Vencidos.
- [ ] Filtrar por período personalizado (início/fim).
- [ ] Filtrar por jornada e status da retirada.
- [ ] Exportar Excel com status amigáveis em pt-BR.

## 9. Auditoria (UserLog)

- [ ] Confirmar logs de retirada com jornada.
- [ ] Confirmar logs de alteração de limite anual.
- [ ] Confirmar logs de alteração de validade no cadastro de uniforme.
- [ ] Confirmar logs de baixa financeira/cobrança.

## 10. Critério de Aprovação Final

- [ ] Nenhuma regressão crítica nos fluxos de retirada, devolução, DP, empréstimo e estoque.
- [ ] Mensagens e labels novos em português brasileiro.
- [ ] Relatórios e exportações funcionando.
- [ ] Auditoria mínima registrada para eventos críticos.


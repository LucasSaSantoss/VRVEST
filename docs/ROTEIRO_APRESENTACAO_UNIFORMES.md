# ROTEIRO_APRESENTACAO_UNIFORMES.md

## Objetivo da Apresentação
Apresentar, de forma prática e didática, como funciona o ecossistema de controle de uniformes no sistema, quais regras foram implementadas e como cada área deve operar no dia a dia.

## Duração Sugerida
- Total: 10 a 15 minutos
- Perguntas: 5 minutos

## Público-Alvo
- Rouparia
- Departamento Pessoal (DP/RH)
- Administração
- Operadores do sistema

## 1. Abertura (1 min)
Mensagem sugerida:
"Este módulo foi organizado para controlar todo o ciclo de uniformes com segurança, clareza operacional e rastreabilidade, reduzindo erros e facilitando auditoria."

## 2. Visão Geral dos Módulos (2 min)
Explicar o menu de Uniformes em blocos:

1. Retirada de Uniformes
2. Devolução de Uniformes
3. Empréstimo de Uniformes
4. Devolução de Empréstimos
5. Baixa de Uniformes - DP
6. Cadastro de Uniformes
7. Estoque de Uniformes

Mensagem-chave:
"Cada módulo foi separado por contexto para evitar confusão de operação."

## 3. Fluxo Operacional Principal (4 min)
### 3.1 Retirada de Uniformes
- Busca por CPF.
- Seleção de itens e tamanhos.
- Registro da retirada com geração de pendência.
- Exibição da última retirada para apoio operacional.

### 3.2 Devolução de Uniformes
- Busca por CPF.
- Lista de retiradas pendentes.
- Devolução por item (mais precisa).
- Quantidade já vem preenchida com o pendente.
- Opção de devolução legada com justificativa obrigatória.

### 3.3 Baixa de Uniformes - DP
- Uso exclusivo do DP/RH e admin.
- Busca por CPF e visualização de pendências com valores.
- Baixa financeira por item.
- Quantidade pré-preenchida para reduzir erro.

Mensagem-chave:
"Devolução física e baixa financeira são processos diferentes."

## 4. Fluxo de Empréstimos (2 min)
### 4.1 Empréstimo de Uniformes
- Saída usando estoque de empréstimos.
- Não permite empréstimo com saldo zerado.

### 4.2 Devolução de Empréstimos
- Tela própria, separada da saída.
- Devolução por item, por CPF.

Mensagem-chave:
"Separar empréstimo e devolução melhora entendimento para o operador."

## 5. Regras e Segurança (2 min)
- Controle por perfil:
1. Admin: acesso total aos módulos novos.
2. Operador: retirada, devolução e empréstimos.
3. DP/RH: baixa financeira.
- Logs e rastreabilidade em ações críticas.
- Notificações por e-mail nas operações de retirada/devolução.
- Mensagens operacionais em português brasileiro.

Mensagem-chave:
"Tudo relevante fica registrado para conferência e auditoria."

## 6. Benefícios Práticos (1 min)
- Menos retrabalho.
- Menos dúvida na operação.
- Mais segurança no controle patrimonial.
- Melhor base para prestação de contas e acompanhamento.

## 7. Encerramento e Próximos Passos (1 min)
Sugestão de fechamento:
"Com essa estrutura, conseguimos operar com mais confiança. Os próximos ajustes serão incrementais, sempre sem quebrar fluxos já validados."

Próximos passos sugeridos:
1. Treinamento rápido por perfil (Rouparia e DP).
2. Validação com usuários-chave em cenário real.
3. Ajustes finos de interface após 1 semana de uso assistido.

## Perguntas Frequentes (apoio para a apresentação)
### A baixa financeira devolve item ao estoque?
Não. Baixa financeira trata cobrança/desconto, não devolução física.

### Onde registrar devolução de uniforme antigo (antes do sistema)?
Na Devolução de Uniformes, usando devolução legada com justificativa obrigatória.

### Onde devolver item emprestado?
No módulo Devolução de Empréstimos.

### Quem pode mexer em estoque?
Admin.

### Quem pode fazer baixa DP?
DP/RH e admin.

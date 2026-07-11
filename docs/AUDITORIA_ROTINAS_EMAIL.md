# Auditoria das Rotinas de E-mail

Data da auditoria: 22/06/2026  
Responsável: Márlon Etiene

## Objetivo

Verificar se a modalidade de envio com confirmação, criada para o módulo de uniformes, interfere nas rotinas legadas de e-mail.

## Confirmado no código

- Existe somente um transportador SMTP, definido em `API/emailService/emailService.js`.
- O transportador utiliza as configurações `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER` e `EMAIL_PASS`.
- As rotinas legadas continuam usando `enviarEmail`, que registra a falha sem interromper a operação principal.
- O módulo novo de uniformes usa `enviarEmailComConfirmacao`, que propaga a falha para o controlador tratar a notificação ao usuário.
- A assinatura legada foi preservada: destinatário, assunto, mensagem, cópia e cópia oculta continuam sendo recebidos na mesma ordem.
- As rotinas legadas identificadas são:
  - retirada de kit cirúrgico;
  - devolução de kit cirúrgico;
  - baixa financeira de pendência.
- A rota genérica de envio usava uma assinatura incompatível com o serviço e foi corrigida.
- O worker de e-mails podia concluir um job mesmo após falha do SMTP e foi corrigido para propagar a falha.

## Diagnóstico de falhas

As falhas de SMTP continuam sendo gravadas em `UserLog` com a ação `Erro ao enviar email`.

Os novos registros passam a informar:

- destinatário;
- assunto;
- mensagem de erro;
- código retornado pelo SMTP;
- comando SMTP relacionado à falha.

Consulta sugerida:

```sql
SELECT
    id,
    JSON_UNQUOTE(JSON_EXTRACT(newData, '$.recipient')) AS destinatario,
    JSON_UNQUOTE(JSON_EXTRACT(newData, '$.subject')) AS assunto,
    JSON_UNQUOTE(JSON_EXTRACT(newData, '$.error')) AS erro,
    JSON_UNQUOTE(JSON_EXTRACT(newData, '$.code')) AS codigo,
    createdAt
FROM UserLog
WHERE action = 'Erro ao enviar email'
ORDER BY createdAt DESC;
```

Registros antigos podem não apresentar essas colunas extraídas, pois armazenavam o erro em outro formato.

## Limite da confirmação

A confirmação do Nodemailer indica que o servidor SMTP aceitou a mensagem. Ela não garante a entrega na caixa de entrada do destinatário, pois a mensagem ainda pode ser direcionada para spam, quarentena ou bloqueada pelo provedor de destino.

## Pendente de validação em produção

Para investigar uma reclamação específica, devem ser confrontados:

- data e horário aproximados da operação;
- endereço de e-mail do colaborador no momento da operação;
- assunto esperado;
- registros `Erro ao enviar email` no `UserLog`;
- logs do servidor da API;
- caixa de spam ou quarentena do destinatário;
- registros do provedor da conta remetente, quando disponíveis.

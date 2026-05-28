# PADRAO_COMENTARIOS_MANUTENCAO.md

## Objetivo

Padronizar comentários de manutenção para rastrear com clareza o que foi alterado em arquivos existentes.

## Regra de uso

1. Usar este padrão sempre que alterar lógica em arquivo existente.
2. Inserir o comentário imediatamente antes do bloco alterado.
3. Manter comentários curtos, objetivos e em português brasileiro.
4. Nesta sessão/projeto, usar sempre `Autor: Márlon Etiene`.

## Template padrão (bloco curto)

```js
// [MANUTENCAO] Motivo: <descrever motivo>
// [MANUTENCAO] Impacto: <descrever impacto funcional esperado>
// [MANUTENCAO] Data: <YYYY-MM-DD>
// [MANUTENCAO] Autor: Márlon Etiene
```

## Template padrão (bloco detalhado)

```js
/**
 * [MANUTENCAO]
 * Motivo: <descrever motivo>
 * Contexto: <opcional - regra de negócio relacionada>
 * Impacto: <descrever impacto funcional esperado>
 * Risco: <baixo|médio|alto>
 * Data: <YYYY-MM-DD>
 * Autor: Márlon Etiene
 */
```

## Exemplo prático

```js
// [MANUTENCAO] Motivo: aplicar limite anual de retirada de uniforme por colaborador
// [MANUTENCAO] Impacto: bloqueia retirada quando quantidade anual excede configuração global
// [MANUTENCAO] Data: 2026-05-18
// [MANUTENCAO] Autor: Márlon Etiene
if (totalAno + novaQuantidade > limiteAnual) {
  return res.status(400).json({ success: false, message: "Limite anual excedido." });
}
```

## Quando não usar

1. Não comentar linhas triviais sem mudança de comportamento.
2. Não duplicar comentário em cada linha do mesmo bloco.
3. Não usar comentários genéricos como "ajuste", "fix", "melhoria".

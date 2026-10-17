# Referência do Lastro

Este documento descreve o contrato público do Lastro: o que o pacote exporta e a API HTTP. A CLI está no `README.md`.

## Pacote

| Ponto de entrada                       | Exporta                                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `@aluiziodeveloper/lastro`             | Objetos de valor (`Dinheiro`, `Quantidade`, `Ticker`), operações, `Carteira`, dados de referência da apuração e casos de uso |
| `@aluiziodeveloper/lastro/adaptadores` | Repositórios em memória, SQLite e Postgres, o importador de CSV, a aplicação HTTP (`criarApp`) e o relógio do sistema        |

A lista exata, nome a nome, está em `test/pacote/exportacoes.test.ts`.

## API HTTP

A API recebe as operações de uma carteira e responde o relatório do mês e a posição. Dinheiro vai e volta em centavos, como texto de dígitos, porque o JSON não tem inteiro de 64 bits; na saída, vai também em reais, para leitura.

<!-- #region rotas -->

### Rotas

| Método | Rota                             | Faz                                       |
| ------ | -------------------------------- | ----------------------------------------- |
| `POST` | `/carteiras/:id/operacoes`       | Registra operações, todas ou nenhuma      |
| `GET`  | `/carteiras/:id/relatorios/:mes` | O relatório de apuração do mês (AAAA-MM)  |
| `GET`  | `/carteiras/:id`                 | A quantidade e o custo de cada ativo hoje |

<!-- #endregion -->

### Registrar operações

```http
POST /carteiras/minha/operacoes
Content-Type: application/json

{
  "operacoes": [
    {
      "id": "op-1",
      "tipo": "compra",
      "data": "2026-02-02",
      "ticker": "PETR4",
      "quantidade": 1000,
      "precoEmCentavos": "2200",
      "custosEmCentavos": "0"
    }
  ]
}
```

Todos os campos são obrigatórios. A data é do pregão, em `AAAA-MM-DD`; o tipo é `compra` ou `venda`; o identificador não pode se repetir na carteira. A resposta é `201`, com `{"registradas": 1}`.

### Relatório do mês

`GET /carteiras/minha/relatorios/2026-04` responde `200` com as linhas do relatório:

```json
{
  "linhas": [
    "Apuração de 04/2026",
    "Ações (operação comum): resultado R$ 3.000,00; compensado R$ 0,00; imposto R$ 450,00",
    "DARF 6015: R$ 450,00, vencimento 29/05/2026"
  ]
}
```

O trecho omite linhas do meio. A apuração começa no primeiro mês com operação e segue até o mês pedido, porque o prejuízo e o imposto pendente vêm dos meses anteriores.

### Posição

`GET /carteiras/minha` responde `200`:

```json
{
  "ativos": [
    {
      "ticker": "PETR4",
      "quantidade": "300",
      "custoTotal": { "centavos": "720000", "reais": "R$ 7.200,00" }
    }
  ]
}
```

<!-- #region erros -->

### Erros

O corpo de um erro do Lastro traz só o tipo, como `{"tipo": "venda-a-descoberto"}`.

| Status | Quando                                       | Tipos                                               |
| ------ | -------------------------------------------- | --------------------------------------------------- |
| `400`  | O endereço ou um campo não é válido          | `entrada-invalida`                                  |
| `409`  | O pedido conflita com o histórico            | `operacao-repetida`, `operacao-fora-de-ordem`       |
| `422`  | O pedido está bem formado e a regra o recusa | `venda-a-descoberto`, `preco-nao-positivo` e outros |
| `500`  | Falha da infraestrutura, como o banco fora   | —                                                   |

Um corpo que não segue o formato da rota, como uma operação sem `tipo`, também responde `400`, mas no formato do Fastify, com `statusCode`, `code`, `error` e `message`.

<!-- #endregion -->

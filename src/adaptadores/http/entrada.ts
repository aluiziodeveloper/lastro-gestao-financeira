import { criarDataDePregao } from '../../dominio/data-de-pregao.js';
import { Dinheiro } from '../../dominio/dinheiro.js';
import { criarIdDeOperacao } from '../../dominio/id-de-operacao.js';
import {
  criarCompra,
  criarVenda,
  type Operacao,
} from '../../dominio/operacao.js';
import { Quantidade } from '../../dominio/quantidade.js';
import { err, ok, type Result } from '../../dominio/resultado.js';
import { Ticker } from '../../dominio/ticker.js';

// A forma de uma operação no JSON, conferida pelo Fastify com o JSON
// Schema abaixo antes de chegar aqui: os centavos vêm como texto de
// dígitos, porque o JSON não tem bigint.
export interface OperacaoEmJson {
  readonly id: string;
  readonly tipo: 'compra' | 'venda';
  readonly data: string;
  readonly ticker: string;
  readonly quantidade: number;
  readonly precoEmCentavos: string;
  readonly custosEmCentavos: string;
}

export const esquemaDaOperacao = {
  type: 'object',
  required: [
    'id',
    'tipo',
    'data',
    'ticker',
    'quantidade',
    'precoEmCentavos',
    'custosEmCentavos',
  ],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    tipo: { enum: ['compra', 'venda'] },
    data: { type: 'string' },
    ticker: { type: 'string' },
    quantidade: { type: 'integer' },
    precoEmCentavos: { type: 'string', pattern: '^[0-9]+$' },
    custosEmCentavos: { type: 'string', pattern: '^[0-9]+$' },
  },
} as const;

export interface ErroDeEntrada {
  readonly tipo: 'entrada-invalida';
  readonly operacao: string;
}

function recusada(operacao: string): Result<never, ErroDeEntrada> {
  return err({ tipo: 'entrada-invalida', operacao });
}

// O sentido de cada campo é do domínio: os construtores decidem.
export function operacaoDoJson(
  json: OperacaoEmJson,
): Result<Operacao, ErroDeEntrada> {
  const id = criarIdDeOperacao(json.id);
  const data = criarDataDePregao(json.data);
  const ticker = Ticker.criar(json.ticker);
  const quantidade = Quantidade.criar(json.quantidade);
  const invalida = recusada(json.id);
  if (!id.ok || !data.ok || !ticker.ok || !quantidade.ok) {
    return invalida;
  }
  const campos = {
    id: id.valor,
    data: data.valor,
    ticker: ticker.valor,
    quantidade: quantidade.valor,
    precoUnitario: Dinheiro.deCentavos(BigInt(json.precoEmCentavos)),
    custos: Dinheiro.deCentavos(BigInt(json.custosEmCentavos)),
  };
  const operacao =
    json.tipo === 'compra' ? criarCompra(campos) : criarVenda(campos);
  return operacao.ok ? ok(operacao.valor) : invalida;
}

export const corpoDeOperacoes = {
  type: 'object',
  required: ['operacoes'],
  additionalProperties: false,
  properties: {
    operacoes: { type: 'array', items: esquemaDaOperacao },
  },
} as const;

// Todas valem ou o pedido inteiro é recusado, com a primeira inválida.
export function todasDoJson(
  operacoes: readonly OperacaoEmJson[],
): Result<readonly Operacao[], ErroDeEntrada> {
  return operacoes.reduce<Result<readonly Operacao[], ErroDeEntrada>>(
    (todas, json) => {
      if (!todas.ok) {
        return todas;
      }
      const operacao = operacaoDoJson(json);
      return operacao.ok
        ? ok([...todas.valor, operacao.valor])
        : operacao;
    },
    ok([]),
  );
}

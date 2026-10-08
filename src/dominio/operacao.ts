import type { DataDePregao } from './data-de-pregao.js';
import type { Dinheiro } from './dinheiro.js';
import type { ErroDeOperacao } from './erros.js';
import type { IdDeOperacao } from './id-de-operacao.js';
import type { Marcado } from './marca.js';
import type { Quantidade } from './quantidade.js';
import { err, ok, type Result } from './resultado.js';
import type { Ticker } from './ticker.js';

// #region operacao-uniao
// Compra e venda têm os mesmos campos; o tipo literal diz qual das duas
// a operação é. A marca fecha a porta aos literais: uma operação só
// nasce pelos construtores, que verificam as regras entre os campos.
export interface CamposDaOperacao {
  readonly id: IdDeOperacao;
  readonly data: DataDePregao;
  readonly ticker: Ticker;
  readonly quantidade: Quantidade;
  readonly precoUnitario: Dinheiro;
  readonly custos: Dinheiro;
}

type OperacaoValidada<Tipo extends string> = Marcado<
  CamposDaOperacao & { readonly tipo: Tipo },
  'OperacaoValidada'
>;

export type Compra = OperacaoValidada<'compra'>;
export type Venda = OperacaoValidada<'venda'>;
export type Operacao = Compra | Venda;
// #endregion

// #region operacao-criar-compra
export function criarCompra(
  campos: CamposDaOperacao,
): Result<Compra, ErroDeOperacao> {
  const invalido = primeiroErro(campos);
  if (invalido !== undefined) {
    return err(invalido);
  }
  // O único `as` do construtor: as regras acabaram de ser verificadas.
  return ok({ ...campos, tipo: 'compra' } as Compra);
}
// #endregion

export function criarVenda(
  campos: CamposDaOperacao,
): Result<Venda, ErroDeOperacao> {
  const invalido = primeiroErro(campos);
  if (invalido !== undefined) {
    return err(invalido);
  }
  return ok({ ...campos, tipo: 'venda' } as Venda);
}

function primeiroErro(
  campos: CamposDaOperacao,
): ErroDeOperacao | undefined {
  if (!campos.precoUnitario.ehPositivo()) {
    return {
      tipo: 'preco-nao-positivo',
      precoUnitario: campos.precoUnitario,
    };
  }
  if (campos.custos.ehNegativo()) {
    return { tipo: 'custos-negativos', custos: campos.custos };
  }
  return undefined;
}

// #region operacao-valor-bruto
export function valorBrutoDaOperacao(
  precoUnitario: Dinheiro,
  quantidade: Quantidade,
): Dinheiro {
  return precoUnitario.multiplicarPor(quantidade);
}
// #endregion

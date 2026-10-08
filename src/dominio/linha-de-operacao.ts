import {
  criarDataDePregao,
  type ErroDeDataDePregao,
} from './data-de-pregao.js';
import { Dinheiro } from './dinheiro.js';
import type { ErroDeOperacao } from './erros.js';
import {
  criarIdDeOperacao,
  type ErroDeIdDeOperacao,
} from './id-de-operacao.js';
import {
  criarCompra,
  criarVenda,
  errosDosValores,
  type Operacao,
} from './operacao.js';
import { type ErroDeQuantidade, Quantidade } from './quantidade.js';
import { err, ok, type Result } from './resultado.js';
import { type ErroDeTicker, Ticker } from './ticker.js';

// #region linha-de-operacao
// Uma linha da importação, ainda sem validar. Preço e custos já chegam
// em centavos.
export interface LinhaDeOperacao {
  readonly id: string;
  readonly tipo: string;
  readonly data: string;
  readonly ticker: string;
  readonly quantidade: number;
  readonly precoEmCentavos: bigint;
  readonly custosEmCentavos: bigint;
}

export type ErroDeLinha =
  | ErroDeIdDeOperacao
  | {
      readonly tipo: 'tipo-de-operacao-desconhecido';
      readonly texto: string;
    }
  | ErroDeDataDePregao
  | ErroDeTicker
  | ErroDeQuantidade
  | ErroDeOperacao;
// #endregion

// #region operacao-de-linha
// Cada campo é validado por conta própria, e todos os erros chegam
// juntos: quem corrige a planilha vê a linha inteira de uma vez.
export function operacaoDeLinha(
  linha: LinhaDeOperacao,
): Result<Operacao, readonly ErroDeLinha[]> {
  const id = criarIdDeOperacao(linha.id);
  const tipo = tipoDaLinha(linha.tipo);
  const data = criarDataDePregao(linha.data);
  const ticker = Ticker.criar(linha.ticker);
  const quantidade = Quantidade.criar(linha.quantidade);
  const precoUnitario = Dinheiro.deCentavos(linha.precoEmCentavos);
  const custos = Dinheiro.deCentavos(linha.custosEmCentavos);
  if (!id.ok || !tipo.ok || !data.ok || !ticker.ok || !quantidade.ok) {
    return err([
      ...errosDe(id),
      ...errosDe(tipo),
      ...errosDe(data),
      ...errosDe(ticker),
      ...errosDe(quantidade),
      ...errosDosValores(precoUnitario, custos),
    ]);
  }
  const campos = {
    id: id.valor,
    data: data.valor,
    ticker: ticker.valor,
    quantidade: quantidade.valor,
    precoUnitario,
    custos,
  };
  const operacao =
    tipo.valor === 'compra' ? criarCompra(campos) : criarVenda(campos);
  return operacao.ok
    ? operacao
    : err(errosDosValores(precoUnitario, custos));
}
// #endregion

function tipoDaLinha(
  texto: string,
): Result<Operacao['tipo'], ErroDeLinha> {
  if (texto === 'compra' || texto === 'venda') {
    return ok(texto);
  }
  return err({ tipo: 'tipo-de-operacao-desconhecido', texto });
}

function errosDe<E>(resultado: Result<unknown, E>): readonly E[] {
  return resultado.ok ? [] : [resultado.erro];
}

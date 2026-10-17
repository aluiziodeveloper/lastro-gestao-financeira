import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import { err, ok, type Result } from '../resultado.js';
import type { Ticker } from '../ticker.js';

// #region cotacoes
// A cotação é um dado de entrada: o Lastro não busca preços, e quem
// pergunta diz a quanto cada ativo está.
export interface Cotacao {
  readonly ticker: Ticker;
  readonly preco: Dinheiro;
}

export type Cotacoes = readonly Cotacao[];

export interface ErroDeCotacao {
  readonly tipo: 'sem-cotacao';
  readonly ticker: Ticker;
}

// A posição de hoje de um ativo pela sua cotação. Faltar a cotação é
// erro, e não zero: um ativo sem preço sumiria das contas.
export function valorDaPosicao(
  carteira: Carteira,
  cotacoes: Cotacoes,
  ativo: Ticker,
): Result<Dinheiro, ErroDeCotacao> {
  const cotacao = cotacoes.find(({ ticker }) =>
    ticker.equivaleA(ativo),
  );
  if (cotacao === undefined) {
    return err({ tipo: 'sem-cotacao', ticker: ativo });
  }
  const quantidade = carteira.quantidadeDe(ativo);
  return ok(cotacao.preco.multiplicarPorUnidades(quantidade));
}

// A soma das posições dos ativos pedidos; a primeira cotação que
// faltar é o erro.
export function valorDeMercado(
  carteira: Carteira,
  cotacoes: Cotacoes,
  ativos: readonly Ticker[],
): Result<Dinheiro, ErroDeCotacao> {
  return ativos.reduce<Result<Dinheiro, ErroDeCotacao>>(
    (soma, ativo) => {
      if (!soma.ok) {
        return soma;
      }
      const posicao = valorDaPosicao(carteira, cotacoes, ativo);
      return posicao.ok ? ok(soma.valor.somar(posicao.valor)) : posicao;
    },
    ok(Dinheiro.deCentavos(0n)),
  );
}
// #endregion

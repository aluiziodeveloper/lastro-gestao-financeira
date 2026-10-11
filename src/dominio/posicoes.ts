import type { ModoDeArredondamento } from './arredondamento.js';
import type { Dinheiro } from './dinheiro.js';
import type { Compra, Venda } from './operacao.js';
import { type ErroDePosicao, Posicao } from './posicao.js';
import type { ErroDeQuantidade } from './quantidade.js';
import { ok, type Result } from './resultado.js';
import type { Ticker } from './ticker.js';

// #region posicoes-classe
// Coleção de primeira classe: o Map fica aqui dentro, e quem usa a
// coleção diz o que quer com cada ativo, sem ver as posições. Cada
// mudança devolve uma coleção nova.
export class Posicoes {
  readonly #porAtivo: ReadonlyMap<string, Posicao>;

  private constructor(porAtivo: ReadonlyMap<string, Posicao>) {
    this.#porAtivo = porAtivo;
  }

  static vazias(): Posicoes {
    return new Posicoes(new Map());
  }

  comprar(compra: Compra): Result<Posicoes, ErroDeQuantidade> {
    const posicao = this.#posicaoDe(compra.ticker).comprar(compra);
    if (!posicao.ok) {
      return posicao;
    }
    return ok(this.#com(compra.ticker, posicao.valor));
  }

  vender(venda: Venda): Result<Posicoes, ErroDePosicao> {
    const posicao = this.#posicaoDe(venda.ticker).vender(venda);
    if (!posicao.ok) {
      return posicao;
    }
    return ok(this.#com(venda.ticker, posicao.valor));
  }

  quantidadeDe(ticker: Ticker): bigint {
    return this.#posicaoDe(ticker).quantidade();
  }

  precoMedioDe(ticker: Ticker, modo: ModoDeArredondamento): Dinheiro {
    return this.#posicaoDe(ticker).precoMedio(modo);
  }

  // Um ativo sem registro tem a posição zerada.
  #posicaoDe(ticker: Ticker): Posicao {
    return this.#porAtivo.get(ticker.paraTexto()) ?? Posicao.zerada();
  }

  #com(ticker: Ticker, posicao: Posicao): Posicoes {
    const porAtivo = new Map(this.#porAtivo);
    porAtivo.set(ticker.paraTexto(), posicao);
    return new Posicoes(porAtivo);
  }
}
// #endregion

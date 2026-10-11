import { Posicao } from './posicao.js';
import type { Ticker } from './ticker.js';

// #region posicoes-classe
// Coleção de primeira classe: o Map fica aqui dentro, e quem usa a
// coleção fala em ativos e posições, e não em chaves. Cada mudança
// devolve uma coleção nova.
export class Posicoes {
  readonly #porAtivo: ReadonlyMap<string, Posicao>;

  private constructor(porAtivo: ReadonlyMap<string, Posicao>) {
    this.#porAtivo = porAtivo;
  }

  static vazias(): Posicoes {
    return new Posicoes(new Map());
  }

  // Um ativo sem registro tem a posição zerada.
  posicaoDe(ticker: Ticker): Posicao {
    return this.#porAtivo.get(ticker.paraTexto()) ?? Posicao.zerada();
  }

  com(ticker: Ticker, posicao: Posicao): Posicoes {
    const porAtivo = new Map(this.#porAtivo);
    porAtivo.set(ticker.paraTexto(), posicao);
    return new Posicoes(porAtivo);
  }
}
// #endregion

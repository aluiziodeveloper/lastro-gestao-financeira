import type { ModoDeArredondamento } from './arredondamento.js';
import type { Dinheiro } from './dinheiro.js';
import type { ErroDeEvento, EventoCorporativo } from './eventos.js';
import type { FracaoDeAcao } from './fracao-de-acao.js';
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
  readonly #fracoes: ReadonlyMap<string, readonly FracaoDeAcao[]>;

  private constructor(
    porAtivo: ReadonlyMap<string, Posicao>,
    fracoes: ReadonlyMap<string, readonly FracaoDeAcao[]>,
  ) {
    this.#porAtivo = porAtivo;
    this.#fracoes = fracoes;
  }

  static vazias(): Posicoes {
    return new Posicoes(new Map(), new Map());
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

  aplicar(evento: EventoCorporativo): Result<Posicoes, ErroDeEvento> {
    const aplicado = evento.aplicarA(this.#posicaoDe(evento.ticker));
    if (!aplicado.ok) {
      return aplicado;
    }
    const { posicao, fracao } = aplicado.valor;
    const comPosicao = this.#com(evento.ticker, posicao);
    return ok(
      fracao === undefined
        ? comPosicao
        : comPosicao.#comFracao(evento.ticker, fracao),
    );
  }

  fracoesPendentesDe(ticker: Ticker): readonly FracaoDeAcao[] {
    return this.#fracoes.get(ticker.paraTexto()) ?? [];
  }

  custoTotalDe(ticker: Ticker): Dinheiro {
    return this.#posicaoDe(ticker).custoTotal();
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
    return new Posicoes(porAtivo, this.#fracoes);
  }

  #comFracao(ticker: Ticker, fracao: FracaoDeAcao): Posicoes {
    const fracoes = new Map(this.#fracoes);
    const chave = ticker.paraTexto();
    fracoes.set(chave, [...(fracoes.get(chave) ?? []), fracao]);
    return new Posicoes(this.#porAtivo, fracoes);
  }
}
// #endregion

import type { ModoDeArredondamento } from './arredondamento.js';
import type { Dinheiro } from './dinheiro.js';
import type { ErroDeCarteira } from './erros.js';
import { garantirExaustividade } from './exaustividade.js';
import type { IdDeCarteira } from './id-de-carteira.js';
import type { Operacao } from './operacao.js';
import { Posicao } from './posicao.js';
import { err, ok, type Result } from './resultado.js';
import type { Ticker } from './ticker.js';

// #region carteira-classe
// A carteira é uma entidade: o identificador continua o mesmo enquanto
// as posições mudam. Cada registro devolve uma carteira nova, com o
// mesmo identificador, e a carteira anterior não muda.
export class Carteira {
  readonly #id: IdDeCarteira;
  readonly #posicoes: ReadonlyMap<string, Posicao>;

  private constructor(
    id: IdDeCarteira,
    posicoes: ReadonlyMap<string, Posicao>,
  ) {
    this.#id = id;
    this.#posicoes = posicoes;
  }

  static abrir(id: IdDeCarteira): Carteira {
    return new Carteira(id, new Map());
  }

  mesmaCarteira(outra: Carteira): boolean {
    return this.#id === outra.#id;
  }

  // #region carteira-registrar
  registrar(operacao: Operacao): Result<Carteira, ErroDeCarteira> {
    const chave = operacao.ticker.paraTexto();
    const posicao = this.#posicoes.get(chave) ?? Posicao.zerada();
    switch (operacao.tipo) {
      case 'compra': {
        const comprada = posicao.comprar(operacao);
        if (!comprada.ok) {
          return comprada;
        }
        return ok(this.#com(chave, comprada.valor));
      }
      case 'venda': {
        const vendida = posicao.vender(operacao);
        if (!vendida.ok) {
          return err({
            tipo: 'venda-a-descoberto',
            ticker: operacao.ticker,
            emCarteira: vendida.erro.emCarteira,
            vendida: vendida.erro.vendida,
          });
        }
        return ok(this.#com(chave, vendida.valor));
      }
      default:
        return garantirExaustividade(operacao);
    }
  }
  // #endregion

  quantidadeDe(ticker: Ticker): bigint {
    return this.#posicaoDe(ticker).quantidade();
  }

  precoMedioDe(ticker: Ticker, modo: ModoDeArredondamento): Dinheiro {
    return this.#posicaoDe(ticker).precoMedio(modo);
  }

  #posicaoDe(ticker: Ticker): Posicao {
    return this.#posicoes.get(ticker.paraTexto()) ?? Posicao.zerada();
  }

  #com(chave: string, posicao: Posicao): Carteira {
    const posicoes = new Map(this.#posicoes);
    posicoes.set(chave, posicao);
    return new Carteira(this.#id, posicoes);
  }
}
// #endregion

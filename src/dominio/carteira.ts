import type { ModoDeArredondamento } from './arredondamento.js';
import type { DataDePregao } from './data-de-pregao.js';
import type { Dinheiro } from './dinheiro.js';
import type { ErroDeCarteira } from './erros.js';
import { garantirExaustividade } from './exaustividade.js';
import type { IdDeCarteira } from './id-de-carteira.js';
import type { Operacao } from './operacao.js';
import type { Posicao } from './posicao.js';
import { Posicoes } from './posicoes.js';
import { err, ok, type Result } from './resultado.js';
import type { Ticker } from './ticker.js';

// #region carteira-classe
// A carteira é uma entidade: o identificador continua o mesmo enquanto
// as posições mudam. Cada registro devolve uma carteira nova, com o
// mesmo identificador, e a carteira anterior não muda.
export class Carteira {
  readonly #id: IdDeCarteira;
  readonly #posicoes: Posicoes;
  readonly #ultimaData: DataDePregao | undefined;

  private constructor(
    id: IdDeCarteira,
    posicoes: Posicoes,
    ultimaData: DataDePregao | undefined,
  ) {
    this.#id = id;
    this.#posicoes = posicoes;
    this.#ultimaData = ultimaData;
  }

  static abrir(id: IdDeCarteira): Carteira {
    return new Carteira(id, Posicoes.vazias(), undefined);
  }

  mesmaCarteira(outra: Carteira): boolean {
    return this.#id === outra.#id;
  }

  // #region carteira-registrar
  registrar(operacao: Operacao): Result<Carteira, ErroDeCarteira> {
    // #region carteira-ordem-cronologica
    // Operações do mesmo pregão entram em qualquer ordem; uma data
    // anterior à última registrada, em qualquer ativo, é recusada.
    const ultimaData = this.#ultimaData;
    if (ultimaData !== undefined && operacao.data < ultimaData) {
      return err({
        tipo: 'operacao-fora-de-ordem',
        data: operacao.data,
        ultimaData,
      });
    }
    // #endregion
    const posicao = this.#posicoes.posicaoDe(operacao.ticker);
    switch (operacao.tipo) {
      case 'compra': {
        const comprada = posicao.comprar(operacao);
        if (!comprada.ok) {
          return comprada;
        }
        return ok(this.#com(operacao, comprada.valor));
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
        return ok(this.#com(operacao, vendida.valor));
      }
      default:
        return garantirExaustividade(operacao);
    }
  }
  // #endregion

  quantidadeDe(ticker: Ticker): bigint {
    return this.#posicoes.posicaoDe(ticker).quantidade();
  }

  precoMedioDe(ticker: Ticker, modo: ModoDeArredondamento): Dinheiro {
    return this.#posicoes.posicaoDe(ticker).precoMedio(modo);
  }

  // A operação registrada traz o ativo e a nova última data.
  #com(operacao: Operacao, posicao: Posicao): Carteira {
    return new Carteira(
      this.#id,
      this.#posicoes.com(operacao.ticker, posicao),
      operacao.data,
    );
  }
}
// #endregion

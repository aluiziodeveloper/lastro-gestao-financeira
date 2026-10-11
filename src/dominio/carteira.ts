import type { ModoDeArredondamento } from './arredondamento.js';
import type { DataDePregao } from './data-de-pregao.js';
import type { Dinheiro } from './dinheiro.js';
import type { ErroDeCarteira, ErroDeLote } from './erros.js';
import { garantirExaustividade } from './exaustividade.js';
import type { IdDeCarteira } from './id-de-carteira.js';
import type { Operacao, Venda } from './operacao.js';
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
    const foraDeOrdem = this.#foraDeOrdem(operacao);
    if (foraDeOrdem !== undefined) {
      return err(foraDeOrdem);
    }
    switch (operacao.tipo) {
      case 'compra': {
        const posicoes = this.#posicoes.comprar(operacao);
        if (!posicoes.ok) {
          return posicoes;
        }
        return ok(this.#com(operacao, posicoes.valor));
      }
      case 'venda':
        return this.#vender(operacao);
      default:
        return garantirExaustividade(operacao);
    }
  }
  // #endregion

  // #region carteira-ordem-cronologica
  // Operações do mesmo pregão entram em qualquer ordem; uma data
  // anterior à última registrada, em qualquer ativo, é recusada.
  #foraDeOrdem(operacao: Operacao): ErroDeCarteira | undefined {
    const ultimaData = this.#ultimaData;
    if (ultimaData !== undefined && operacao.data < ultimaData) {
      return {
        tipo: 'operacao-fora-de-ordem',
        data: operacao.data,
        ultimaData,
      };
    }
    return undefined;
  }
  // #endregion

  // #region carteira-vender
  // A posição só sabe que a venda passou da quantidade; a carteira
  // diz o ativo e dá ao erro o nome da regra.
  #vender(venda: Venda): Result<Carteira, ErroDeCarteira> {
    const posicoes = this.#posicoes.vender(venda);
    if (!posicoes.ok) {
      return err({
        tipo: 'venda-a-descoberto',
        ticker: venda.ticker,
        emCarteira: posicoes.erro.emCarteira,
        vendida: posicoes.erro.vendida,
      });
    }
    return ok(this.#com(venda, posicoes.valor));
  }
  // #endregion

  // #region carteira-registrar-todas
  // Desafio do Capítulo 5: registre o lote inteiro ou nenhuma
  // operação. Se uma operação violar uma invariante, a carteira fica
  // como estava, e o erro aponta a primeira que falhou. Os testes
  // estão em test/dominio/carteira-lote.test.ts.
  registrarTodas(
    operacoes: readonly Operacao[],
  ): Result<Carteira, ErroDeLote> {
    throw new Error(
      `Desafio do Capítulo 5 não resolvido (operações: ${String(operacoes.length)})`,
    );
  }
  // #endregion

  quantidadeDe(ticker: Ticker): bigint {
    return this.#posicoes.quantidadeDe(ticker);
  }

  precoMedioDe(ticker: Ticker, modo: ModoDeArredondamento): Dinheiro {
    return this.#posicoes.precoMedioDe(ticker, modo);
  }

  // A operação registrada traz a nova última data.
  #com(operacao: Operacao, posicoes: Posicoes): Carteira {
    return new Carteira(this.#id, posicoes, operacao.data);
  }
}
// #endregion

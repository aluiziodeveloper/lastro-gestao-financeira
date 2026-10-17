import type { ModoDeArredondamento } from './arredondamento.js';
import type { Dinheiro } from './dinheiro.js';
import type { ErroDeCarteira } from './erros.js';
import type { EventoCorporativo } from './eventos.js';
import type { FracaoDeAcao } from './fracao-de-acao.js';
import { garantirExaustividade } from './exaustividade.js';
import type { IdDeCarteira } from './id-de-carteira.js';
import type { Compra, Operacao, Venda } from './operacao.js';
import { type Datado, OrdemCronologica } from './ordem-cronologica.js';
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
  readonly #ordem: OrdemCronologica;

  private constructor(
    id: IdDeCarteira,
    posicoes: Posicoes,
    ordem: OrdemCronologica,
  ) {
    this.#id = id;
    this.#posicoes = posicoes;
    this.#ordem = ordem;
  }

  static abrir(id: IdDeCarteira): Carteira {
    return new Carteira(
      id,
      Posicoes.vazias(),
      OrdemCronologica.vazia(),
    );
  }

  mesmaCarteira(outra: Carteira): boolean {
    return this.#id === outra.#id;
  }

  // #region carteira-registrar
  registrar(operacao: Operacao): Result<Carteira, ErroDeCarteira> {
    const foraDeOrdem = this.#ordem.recusa(operacao);
    if (foraDeOrdem !== undefined) {
      return err(foraDeOrdem);
    }
    switch (operacao.tipo) {
      case 'compra':
        return this.#comprar(operacao);
      case 'venda':
        return this.#vender(operacao);
      default:
        return garantirExaustividade(operacao);
    }
  }
  // #endregion

  // #region carteira-aplicar-evento
  // O evento corporativo também entra em ordem cronológica.
  aplicar(evento: EventoCorporativo): Result<Carteira, ErroDeCarteira> {
    const foraDeOrdem = this.#ordem.recusa(evento);
    if (foraDeOrdem !== undefined) {
      return err(foraDeOrdem);
    }
    const posicoes = this.#posicoes.aplicar(evento);
    if (!posicoes.ok) {
      return posicoes;
    }
    return ok(this.#com(evento, posicoes.valor));
  }
  // #endregion

  #comprar(compra: Compra): Result<Carteira, ErroDeCarteira> {
    const posicoes = this.#posicoes.comprar(compra);
    if (!posicoes.ok) {
      return posicoes;
    }
    return ok(this.#com(compra, posicoes.valor));
  }

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

  fracoesPendentesDe(ticker: Ticker): readonly FracaoDeAcao[] {
    return this.#posicoes.fracoesPendentesDe(ticker);
  }

  custoTotalDe(ticker: Ticker): Dinheiro {
    return this.#posicoes.custoTotalDe(ticker);
  }

  quantidadeDe(ticker: Ticker): bigint {
    return this.#posicoes.quantidadeDe(ticker);
  }

  ativos(): readonly Ticker[] {
    return this.#posicoes.ativos();
  }

  precoMedioDe(ticker: Ticker, modo: ModoDeArredondamento): Dinheiro {
    return this.#posicoes.precoMedioDe(ticker, modo);
  }

  // A operação registrada traz a nova última data.
  #com(operacao: Datado, posicoes: Posicoes): Carteira {
    const ordem = this.#ordem.depoisDe(operacao);
    return new Carteira(this.#id, posicoes, ordem);
  }
}
// #endregion

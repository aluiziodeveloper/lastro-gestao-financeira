import type { ModoDeArredondamento } from './arredondamento.js';
import type { Dinheiro } from './dinheiro.js';
import type { Compra } from './operacao.js';
import type { ErroDeQuantidade, Quantidade } from './quantidade.js';
import { ok, type Result } from './resultado.js';

// #region posicao-primeira-compra
// A posição de um ativo guarda o custo total e a quantidade; o preço
// médio é calculado a partir dos dois, quando alguém pergunta.
export class Posicao {
  readonly #quantidade: Quantidade;
  readonly #custoTotal: Dinheiro;

  private constructor(quantidade: Quantidade, custoTotal: Dinheiro) {
    this.#quantidade = quantidade;
    this.#custoTotal = custoTotal;
  }

  // #region posicao-custos-operacionais
  // Os custos da nota entram no custo de aquisição (IN RFB 1.585/2015,
  // art. 56, § 3º).
  static abrir(compra: Compra): Posicao {
    return new Posicao(
      compra.quantidade,
      compra.precoUnitario
        .multiplicarPor(compra.quantidade)
        .somar(compra.custos),
    );
  }

  // #region posicao-comprar
  comprar(compra: Compra): Result<Posicao, ErroDeQuantidade> {
    const quantidade = this.#quantidade.somar(compra.quantidade);
    if (!quantidade.ok) {
      return quantidade;
    }
    const custo = compra.precoUnitario
      .multiplicarPor(compra.quantidade)
      .somar(compra.custos);
    return ok(
      new Posicao(quantidade.valor, this.#custoTotal.somar(custo)),
    );
  }
  // #endregion
  // #endregion

  precoMedio(modo: ModoDeArredondamento): Dinheiro {
    return this.#custoTotal.dividirPor(this.#quantidade, modo);
  }
}
// #endregion

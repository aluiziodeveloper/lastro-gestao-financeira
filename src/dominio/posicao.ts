import type { ModoDeArredondamento } from './arredondamento.js';
import type { Dinheiro } from './dinheiro.js';
import type { Compra } from './operacao.js';
import type { Quantidade } from './quantidade.js';

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

  static abrir(compra: Compra): Posicao {
    return new Posicao(
      compra.quantidade,
      compra.precoUnitario.multiplicarPor(compra.quantidade),
    );
  }

  precoMedio(modo: ModoDeArredondamento): Dinheiro {
    return this.#custoTotal.dividirPor(this.#quantidade, modo);
  }
}
// #endregion

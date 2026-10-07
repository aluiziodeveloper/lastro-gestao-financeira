import type { ObjetoDeValor } from './objeto-de-valor.js';

// #region dinheiro-classe
export class Dinheiro implements ObjetoDeValor<Dinheiro> {
  readonly #centavos: bigint;

  private constructor(centavos: bigint) {
    this.#centavos = centavos;
  }

  static deCentavos(centavos: bigint): Dinheiro {
    return new Dinheiro(centavos);
  }

  equivaleA(outro: Dinheiro): boolean {
    return this.#centavos === outro.#centavos;
  }

  // #region dinheiro-somar-subtrair
  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.#centavos + outro.#centavos);
  }

  subtrair(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.#centavos - outro.#centavos);
  }
  // #endregion
}
// #endregion

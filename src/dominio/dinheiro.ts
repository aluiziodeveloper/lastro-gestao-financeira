import {
  dividirArredondando,
  type ModoDeArredondamento,
} from './arredondamento.js';
import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';
import type { Quantidade } from './quantidade.js';

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

  // #region dinheiro-inspecionar
  [inspecionar](): string {
    return `Dinheiro(${String(this.#centavos)} centavos)`;
  }
  // #endregion

  // #region dinheiro-somar-subtrair
  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.#centavos + outro.#centavos);
  }

  subtrair(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.#centavos - outro.#centavos);
  }
  // #endregion

  // #region dinheiro-multiplicar
  multiplicarPor(quantidade: Quantidade): Dinheiro {
    return new Dinheiro(this.#centavos * quantidade.paraBigInt());
  }
  // #endregion

  // #region dinheiro-dividir
  dividirPor(
    divisor: Quantidade,
    modo: ModoDeArredondamento,
  ): Dinheiro {
    return new Dinheiro(
      dividirArredondando(this.#centavos, divisor.paraBigInt(), modo),
    );
  }
  // #endregion
}
// #endregion

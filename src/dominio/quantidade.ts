import type { ObjetoDeValor } from './objeto-de-valor.js';

// #region quantidade-classe
export class Quantidade implements ObjetoDeValor<Quantidade> {
  readonly #unidades: number;

  private constructor(unidades: number) {
    this.#unidades = unidades;
  }

  static de(unidades: number): Quantidade {
    if (!Number.isSafeInteger(unidades) || unidades <= 0) {
      throw new RangeError(
        `Quantidade deve ser inteira e positiva: ${String(unidades)}`,
      );
    }
    return new Quantidade(unidades);
  }

  equivaleA(outra: Quantidade): boolean {
    return this.#unidades === outra.#unidades;
  }

  paraBigInt(): bigint {
    return BigInt(this.#unidades);
  }
}
// #endregion

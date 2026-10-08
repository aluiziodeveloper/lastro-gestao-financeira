import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';
import { err, ok, type Result } from './resultado.js';

// #region erro-de-quantidade
// Cada erro diz o fato de negócio que impede a quantidade de existir.
export type ErroDeQuantidade =
  | {
      readonly tipo: 'quantidade-nao-inteira';
      readonly unidades: number;
    }
  | {
      readonly tipo: 'quantidade-nao-positiva';
      readonly unidades: number;
    }
  | {
      readonly tipo: 'quantidade-acima-do-limite';
      readonly unidades: number;
    };
// #endregion

// #region quantidade-classe
export class Quantidade implements ObjetoDeValor<Quantidade> {
  readonly #unidades: number;

  private constructor(unidades: number) {
    this.#unidades = unidades;
  }

  // #region quantidade-criar
  static criar(unidades: number): Result<Quantidade, ErroDeQuantidade> {
    if (!Number.isInteger(unidades)) {
      return err({ tipo: 'quantidade-nao-inteira', unidades });
    }
    if (unidades <= 0) {
      return err({ tipo: 'quantidade-nao-positiva', unidades });
    }
    if (!Number.isSafeInteger(unidades)) {
      return err({ tipo: 'quantidade-acima-do-limite', unidades });
    }
    return ok(new Quantidade(unidades));
  }
  // #endregion

  equivaleA(outra: Quantidade): boolean {
    return this.#unidades === outra.#unidades;
  }

  [inspecionar](): string {
    return `Quantidade(${String(this.#unidades)})`;
  }

  // #region quantidade-somar
  // A soma de duas quantidades válidas ainda pode passar do limite.
  somar(outra: Quantidade): Result<Quantidade, ErroDeQuantidade> {
    return Quantidade.criar(this.#unidades + outra.#unidades);
  }
  // #endregion

  paraBigInt(): bigint {
    return BigInt(this.#unidades);
  }
}
// #endregion

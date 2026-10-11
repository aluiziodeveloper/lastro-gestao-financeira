import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';
import type { Quantidade } from './quantidade.js';

// #region proporcao-classe
// Quantas ações viram quantas: no desdobramento 1:2, cada ação vira
// duas; no grupamento 10:1, dez viram uma.
export class Proporcao implements ObjetoDeValor<Proporcao> {
  readonly #de: Quantidade;
  readonly #para: Quantidade;

  private constructor(de: Quantidade, para: Quantidade) {
    this.#de = de;
    this.#para = para;
  }

  static entre(de: Quantidade, para: Quantidade): Proporcao {
    return new Proporcao(de, para);
  }

  de(): Quantidade {
    return this.#de;
  }

  para(): Quantidade {
    return this.#para;
  }

  equivaleA(outra: Proporcao): boolean {
    return (
      this.#de.equivaleA(outra.#de) && this.#para.equivaleA(outra.#para)
    );
  }

  [inspecionar](): string {
    const de = String(this.#de.paraBigInt());
    const para = String(this.#para.paraBigInt());
    return `Proporcao(${de}:${para})`;
  }
}
// #endregion

import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';
import { type ErroDeQuantidade, Quantidade } from './quantidade.js';
import type { Result } from './resultado.js';

// #region proporcao-classe
// Quantas ações viram quantas: no desdobramento 1:2, cada ação vira
// duas; no grupamento 10:1, dez viram uma. A proporção responde às
// perguntas do evento e se aplica a uma quantidade.
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

  aumenta(): boolean {
    return this.#para.paraBigInt() > this.#de.paraBigInt();
  }

  diminui(): boolean {
    return this.#para.paraBigInt() < this.#de.paraBigInt();
  }

  aplicadaA(
    quantidade: Quantidade,
  ): Result<Quantidade, ErroDeQuantidade> {
    const unidades =
      (quantidade.paraBigInt() * this.#para.paraBigInt()) /
      this.#de.paraBigInt();
    return Quantidade.criar(Number(unidades));
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

import type { Dinheiro } from './dinheiro.js';
import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';

// #region fracao-de-acao
// O que sobra de um evento que não divide a posição em ações inteiras:
// a fração de uma ação nova e o custo que ela leva. A companhia agrupa
// as frações e as vende em leilão; até lá, a fração fica pendente.
export class FracaoDeAcao implements ObjetoDeValor<FracaoDeAcao> {
  readonly #numerador: bigint;
  readonly #denominador: bigint;
  readonly #custo: Dinheiro;

  private constructor(
    numerador: bigint,
    denominador: bigint,
    custo: Dinheiro,
  ) {
    this.#numerador = numerador;
    this.#denominador = denominador;
    this.#custo = custo;
  }

  static de(
    numerador: bigint,
    denominador: bigint,
    custo: Dinheiro,
  ): FracaoDeAcao {
    return new FracaoDeAcao(numerador, denominador, custo);
  }

  numerador(): bigint {
    return this.#numerador;
  }

  custo(): Dinheiro {
    return this.#custo;
  }

  equivaleA(outra: FracaoDeAcao): boolean {
    return (
      this.#numerador * outra.#denominador ===
        outra.#numerador * this.#denominador &&
      this.#custo.equivaleA(outra.#custo)
    );
  }

  [inspecionar](): string {
    const numerador = String(this.#numerador);
    const denominador = String(this.#denominador);
    const custo = this.#custo[inspecionar]();
    return `FracaoDeAcao(${numerador}/${denominador} · ${custo})`;
  }
}
// #endregion

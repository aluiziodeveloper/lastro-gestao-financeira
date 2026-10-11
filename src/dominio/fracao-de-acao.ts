import type { Dinheiro } from './dinheiro.js';
import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';

// #region maximo-divisor-comum
// Algoritmo de Euclides: o resto da divisão troca de lugar com o
// divisor até zerar. Os dois números são positivos aqui.
function maximoDivisorComum(a: bigint, b: bigint): bigint {
  return b === 0n ? a : maximoDivisorComum(b, a % b);
}
// #endregion

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

  // #region fracao-somar
  // Duas frações do mesmo ativo, pendentes do mesmo leilão, viram uma:
  // denominador comum, custos somados e o resultado simplificado, para
  // que o denominador não cresça a cada soma.
  somar(outra: FracaoDeAcao): FracaoDeAcao {
    const numerador =
      this.#numerador * outra.#denominador +
      outra.#numerador * this.#denominador;
    const denominador = this.#denominador * outra.#denominador;
    const divisor = maximoDivisorComum(numerador, denominador);
    return new FracaoDeAcao(
      numerador / divisor,
      denominador / divisor,
      this.#custo.somar(outra.#custo),
    );
  }
  // #endregion

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

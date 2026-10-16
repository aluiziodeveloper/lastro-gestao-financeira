import { Dinheiro } from './dinheiro.js';
import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';

// #region aliquota
// A alíquota é uma fração exata, e não um `number`: 15% é 15/100, e
// uma alíquota como 17,5% será 175/1000, sem perda.
export class Aliquota implements ObjetoDeValor<Aliquota> {
  readonly #numerador: bigint;
  readonly #denominador: bigint;

  private constructor(numerador: bigint, denominador: bigint) {
    this.#numerador = numerador;
    this.#denominador = denominador;
  }

  static de(numerador: bigint, denominador: bigint): Aliquota {
    return new Aliquota(numerador, denominador);
  }

  // A alíquota incide sobre o ganho; prejuízo não gera imposto.
  sobreGanho(resultado: Dinheiro): Dinheiro {
    if (!resultado.ehPositivo()) {
      return Dinheiro.deCentavos(0n);
    }
    return this.sobre(resultado);
  }

  // A alíquota sobre um valor, como a retenção na fonte sobre um
  // provento, arredondada ao centavo, meio para cima.
  sobre(valor: Dinheiro): Dinheiro {
    return valor.multiplicarPorFracao(
      this.#numerador,
      this.#denominador,
      'meio-para-cima',
    );
  }

  equivaleA(outra: Aliquota): boolean {
    return (
      this.#numerador * outra.#denominador ===
      outra.#numerador * this.#denominador
    );
  }

  [inspecionar](): string {
    const numerador = String(this.#numerador);
    const denominador = String(this.#denominador);
    return `Aliquota(${numerador}/${denominador})`;
  }
}
// #endregion

import type { ModoDeArredondamento } from './arredondamento.js';
import { Dinheiro } from './dinheiro.js';
import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';

// #region politica-do-imposto
// A lei não diz como arredondar o imposto ao centavo; o Lastro decide,
// e a decisão tem nome para que se possa achá-la, testá-la e mudá-la
// num lugar só. As duas vão ao contador (X02).
export const arredondamentoDoImposto: ModoDeArredondamento =
  'meio-para-cima';

export const arredondamentoDaRetencao: ModoDeArredondamento =
  'meio-para-cima';
// #endregion

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

  // #region aliquota-com-politica
  // A alíquota incide sobre o ganho; prejuízo não gera imposto.
  sobreGanho(
    resultado: Dinheiro,
    arredondamento: ModoDeArredondamento,
  ): Dinheiro {
    if (!resultado.ehPositivo()) {
      return Dinheiro.deCentavos(0n);
    }
    return this.sobre(resultado, arredondamento);
  }

  // A alíquota sobre um valor, como a retenção na fonte sobre um
  // provento, arredondada ao centavo pela política de quem a aplica.
  sobre(
    valor: Dinheiro,
    arredondamento: ModoDeArredondamento,
  ): Dinheiro {
    return valor.multiplicarPorFracao(
      this.#numerador,
      this.#denominador,
      arredondamento,
    );
  }
  // #endregion

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

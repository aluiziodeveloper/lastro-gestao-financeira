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

  // #region dinheiro-sinal
  ehPositivo(): boolean {
    return this.#centavos > 0n;
  }

  ehNegativo(): boolean {
    return this.#centavos < 0n;
  }
  // #endregion

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

  // #region dinheiro-repartir
  // Reparte o valor na proporção dos pesos, todos positivos. Cada parte
  // começa no piso da proporção exata; os centavos que faltam para a
  // soma vão, um a um, às partes de maior resto.
  repartirNaProporcao(
    pesos: readonly [Dinheiro, ...Dinheiro[]],
  ): readonly Dinheiro[] {
    const total = pesos.reduce(
      (soma, peso) => soma + peso.#centavos,
      0n,
    );
    const exatas = pesos.map((peso) => this.#centavos * peso.#centavos);
    const pisos = exatas.map((exata) => exata / total);
    const distribuido = pisos.reduce((soma, piso) => soma + piso, 0n);
    const sobra = Number(this.#centavos - distribuido);
    // O sort é estável: no empate de restos, vale a ordem dos pesos.
    const porMaiorResto = exatas
      .map((exata, indice) => ({ indice, resto: exata % total }))
      .sort(
        (um, outro) =>
          Number(outro.resto > um.resto) -
          Number(outro.resto < um.resto),
      );
    const recebemCentavo = new Set(
      porMaiorResto.slice(0, sobra).map(({ indice }) => indice),
    );
    return pisos.map(
      (piso, indice) =>
        new Dinheiro(recebemCentavo.has(indice) ? piso + 1n : piso),
    );
  }
  // #endregion
}
// #endregion

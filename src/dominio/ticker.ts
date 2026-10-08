import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';

// #region ticker-classe
// Quatro letras e um ou dois dígitos: PETR4, VALE3, BOVA11. O sufixo F
// do mercado fracionário entra com a importação de notas.
const FORMATO_DA_B3 = /^[A-Z]{4}\d{1,2}$/;

export class Ticker implements ObjetoDeValor<Ticker> {
  readonly #codigo: string;

  private constructor(codigo: string) {
    this.#codigo = codigo;
  }

  static de(texto: string): Ticker {
    const codigo = texto.trim().toUpperCase();
    if (!FORMATO_DA_B3.test(codigo)) {
      throw new Error(`Ticker fora do formato da B3: '${texto}'`);
    }
    return new Ticker(codigo);
  }

  equivaleA(outro: Ticker): boolean {
    return this.#codigo === outro.#codigo;
  }

  [inspecionar](): string {
    return `Ticker(${this.#codigo})`;
  }
}
// #endregion

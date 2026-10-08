import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';
import { err, ok, type Result } from './resultado.js';

// #region erro-de-ticker
export interface ErroDeTicker {
  readonly tipo: 'ticker-fora-do-formato';
  readonly texto: string;
}
// #endregion

// #region ticker-classe
// Quatro letras e um ou dois dígitos: PETR4, VALE3, BOVA11. O sufixo F
// do mercado fracionário entra com a importação de notas.
const formatoDaB3 = /^[A-Z]{4}\d{1,2}$/;

export class Ticker implements ObjetoDeValor<Ticker> {
  readonly #codigo: string;

  private constructor(codigo: string) {
    this.#codigo = codigo;
  }

  // #region ticker-criar
  static criar(texto: string): Result<Ticker, ErroDeTicker> {
    const codigo = texto.trim().toUpperCase();
    if (!formatoDaB3.test(codigo)) {
      return err({ tipo: 'ticker-fora-do-formato', texto });
    }
    return ok(new Ticker(codigo));
  }
  // #endregion

  equivaleA(outro: Ticker): boolean {
    return this.#codigo === outro.#codigo;
  }

  [inspecionar](): string {
    return `Ticker(${this.#codigo})`;
  }
}
// #endregion

import type { DataDoCalendario } from './data-do-calendario.js';
import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';
import { err, ok, type Result } from './resultado.js';

export interface ErroDeVigencia {
  readonly tipo: 'vigencia-vazia';
  readonly inicio: DataDoCalendario;
  readonly fim: DataDoCalendario;
}

// #region vigencia
// Intervalo semiaberto [início, fim): o início entra, o fim não. Sem
// fim, vale daí em diante. Duas vigências vizinhas dividem a mesma
// data, o fim de uma e o início da outra, sem o "dia menos um".
export class Vigencia implements ObjetoDeValor<Vigencia> {
  readonly #inicio: DataDoCalendario;
  readonly #fim: DataDoCalendario | undefined;

  private constructor(
    inicio: DataDoCalendario,
    fim: DataDoCalendario | undefined,
  ) {
    this.#inicio = inicio;
    this.#fim = fim;
  }

  static desde(inicio: DataDoCalendario): Vigencia {
    return new Vigencia(inicio, undefined);
  }

  static entre(
    inicio: DataDoCalendario,
    fim: DataDoCalendario,
  ): Result<Vigencia, ErroDeVigencia> {
    if (fim <= inicio) {
      return err({ tipo: 'vigencia-vazia', inicio, fim });
    }
    return ok(new Vigencia(inicio, fim));
  }

  contem(data: DataDoCalendario): boolean {
    return data >= this.#inicio && !this.#terminouAntesDe(data);
  }

  #terminouAntesDe(data: DataDoCalendario): boolean {
    return this.#fim !== undefined && data >= this.#fim;
  }

  equivaleA(outra: Vigencia): boolean {
    return this.#inicio === outra.#inicio && this.#fim === outra.#fim;
  }

  [inspecionar](): string {
    return `Vigencia[${this.#inicio}, ${this.#fim ?? '…'})`;
  }
}
// #endregion

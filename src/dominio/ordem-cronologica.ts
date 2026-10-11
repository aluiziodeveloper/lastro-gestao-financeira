import type { DataDePregao } from './data-de-pregao.js';
import type { ErroDeCarteira } from './erros.js';

// Qualquer coisa com data entra na ordem: operações e eventos.
export interface Datado {
  readonly data: DataDePregao;
}

// #region ordem-cronologica
// A última data registrada e a regra que a protege: operações do mesmo
// pregão entram em qualquer ordem; uma data anterior, em qualquer
// ativo, é recusada.
export class OrdemCronologica {
  readonly #ultimaData: DataDePregao | undefined;

  private constructor(ultimaData: DataDePregao | undefined) {
    this.#ultimaData = ultimaData;
  }

  static vazia(): OrdemCronologica {
    return new OrdemCronologica(undefined);
  }

  recusa(datado: Datado): ErroDeCarteira | undefined {
    const ultimaData = this.#ultimaData;
    if (ultimaData !== undefined && datado.data < ultimaData) {
      return {
        tipo: 'operacao-fora-de-ordem',
        data: datado.data,
        ultimaData,
      };
    }
    return undefined;
  }

  depoisDe(datado: Datado): OrdemCronologica {
    return new OrdemCronologica(datado.data);
  }
}
// #endregion

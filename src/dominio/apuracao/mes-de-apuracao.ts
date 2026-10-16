import {
  criarDataDoCalendario,
  type DataDoCalendario,
} from '../data-do-calendario.js';
import { inspecionar, type ObjetoDeValor } from '../objeto-de-valor.js';
import { err, ok, type Result } from '../resultado.js';

export interface ErroDeMesDeApuracao {
  readonly tipo: 'mes-fora-do-formato' | 'mes-inexistente';
  readonly texto: string;
}

const formatoDoMes = /^\d{4}-\d{2}$/;

// #region mes-de-apuracao
// O mês que se apura, como 2026-03. A lei de um mês é a do seu
// primeiro dia: todo regime começa no dia 1.
export class MesDeApuracao implements ObjetoDeValor<MesDeApuracao> {
  readonly #primeiroDia: DataDoCalendario;

  private constructor(primeiroDia: DataDoCalendario) {
    this.#primeiroDia = primeiroDia;
  }

  static criar(
    texto: string,
  ): Result<MesDeApuracao, ErroDeMesDeApuracao> {
    if (!formatoDoMes.test(texto)) {
      return err({ tipo: 'mes-fora-do-formato', texto });
    }
    const primeiroDia = criarDataDoCalendario(`${texto}-01`);
    if (!primeiroDia.ok) {
      return err({ tipo: 'mes-inexistente', texto });
    }
    return ok(new MesDeApuracao(primeiroDia.valor));
  }

  // O mês de uma data que já existe. O dia 1 desse mês também existe,
  // e por isso este construtor não falha.
  static de(data: DataDoCalendario): MesDeApuracao {
    return new MesDeApuracao(
      `${data.slice(0, 8)}01` as DataDoCalendario,
    );
  }

  primeiroDia(): DataDoCalendario {
    return this.#primeiroDia;
  }

  // O ano e o mês da data são os deste mês.
  contem(data: DataDoCalendario): boolean {
    return data.slice(0, 7) === this.#primeiroDia.slice(0, 7);
  }

  equivaleA(outro: MesDeApuracao): boolean {
    return this.#primeiroDia === outro.#primeiroDia;
  }

  [inspecionar](): string {
    return `MesDeApuracao(${this.#primeiroDia.slice(0, 7)})`;
  }
}
// #endregion

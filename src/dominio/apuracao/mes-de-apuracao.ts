import {
  criarDataDoCalendario,
  primeiroDiaDeslocado,
  primeiroDiaDoMesSeguinte,
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

  // #region mes-do-dia
  // O mês de uma data que já existe: não há o que validar, e o
  // deslocamento de zero meses dá o dia 1 dele.
  static doDia(data: DataDoCalendario): MesDeApuracao {
    return new MesDeApuracao(primeiroDiaDeslocado(data, 0));
  }
  // #endregion

  primeiroDia(): DataDoCalendario {
    return this.#primeiroDia;
  }

  // O ano e o mês da data são os deste mês.
  contem(data: DataDoCalendario): boolean {
    return data.slice(0, 7) === this.#primeiroDia.slice(0, 7);
  }

  // #region mes-seguinte
  // Logo depois do outro mês: dezembro é seguido pelo janeiro do ano
  // seguinte, porque a contagem não recomeça a cada ano.
  ehSeguinteDe(anterior: MesDeApuracao): boolean {
    return this.#contagem() === anterior.#contagem() + 1;
  }

  // Os meses contados desde o ano zero.
  #contagem(): number {
    const ano = Number(this.#primeiroDia.slice(0, 4));
    const mes = Number(this.#primeiroDia.slice(5, 7));
    return ano * 12 + mes;
  }
  // #endregion

  // #region mes-dias
  // Os dias do mês, do primeiro ao último. Das 31 datas candidatas,
  // ficam as que existem no calendário: 28 a 31, conforme o mês.
  dias(): readonly DataDoCalendario[] {
    const anoEMes = this.#primeiroDia.slice(0, 8);
    return Array.from({ length: 31 }, (_, indice) =>
      criarDataDoCalendario(
        anoEMes + String(indice + 1).padStart(2, '0'),
      ),
    )
      .filter((data) => data.ok)
      .map((data) => data.valor);
  }
  // #endregion

  // #region meses-ate
  // Os meses deste até o fim, um a um, com os dois dentro; vazio se o
  // fim vem antes deste.
  mesesAte(fim: MesDeApuracao): readonly MesDeApuracao[] {
    const quantos = fim.#contagem() - this.#contagem() + 1;
    return Array.from({ length: Math.max(quantos, 0) }, (_, indice) =>
      this.deslocado(indice),
    );
  }
  // #endregion

  // O mês depois deste, em que vencem os impostos deste.
  seguinte(): MesDeApuracao {
    return new MesDeApuracao(
      primeiroDiaDoMesSeguinte(this.#primeiroDia),
    );
  }

  // #region mes-deslocado
  // O mês a tantos meses deste: deslocado(1) é o seguinte, e
  // deslocado(-12), o mesmo mês do ano anterior.
  deslocado(meses: number): MesDeApuracao {
    return new MesDeApuracao(
      primeiroDiaDeslocado(this.#primeiroDia, meses),
    );
  }

  // A data cai no mesmo mês do ano que este, em qualquer ano: março
  // de 2025 e março de 2027 são o mesmo mês do ano.
  mesmoMesDoAno(data: DataDoCalendario): boolean {
    return data.slice(5, 7) === this.#primeiroDia.slice(5, 7);
  }
  // #endregion

  // O último mês do ano, em que saldos anuais se encerram.
  ehDezembro(): boolean {
    return this.#primeiroDia.slice(5, 7) === '12';
  }

  equivaleA(outro: MesDeApuracao): boolean {
    return this.#primeiroDia === outro.#primeiroDia;
  }

  [inspecionar](): string {
    return `MesDeApuracao(${this.#primeiroDia.slice(0, 7)})`;
  }
}
// #endregion

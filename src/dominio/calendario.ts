import type { MesDeApuracao } from './apuracao/mes-de-apuracao.js';
import type { DataDoCalendario } from './data-do-calendario.js';
import { err, ok, type Result } from './resultado.js';

// #region calendario-dias-uteis
// Um dia que não é útil todo ano, como 'MM-DD'. Um feriado criado por
// lei nova vale a partir de um ano.
export interface DiaNaoUtil {
  readonly diaDoAno: string;
  readonly desde?: number;
}

// Feriados nacionais: Lei 662/1949, art. 1º, na redação da Lei
// 10.607/2002; Lei 6.802/1980 (12 de outubro); Lei 14.759/2023 (20 de
// novembro, publicada em 22/12/2023, e por isso a partir de 2024). O
// 31 de dezembro não é feriado, mas não serve de vencimento: na agenda
// tributária da Receita, o código 6015 de novembro de 2025 venceu em
// 30/12/2025, uma terça-feira.
export const naoUteisNacionais: readonly DiaNaoUtil[] = [
  { diaDoAno: '01-01' },
  { diaDoAno: '04-21' },
  { diaDoAno: '05-01' },
  { diaDoAno: '09-07' },
  { diaDoAno: '10-12' },
  { diaDoAno: '11-02' },
  { diaDoAno: '11-15' },
  { diaDoAno: '11-20', desde: 2024 },
  { diaDoAno: '12-25' },
  { diaDoAno: '12-31' },
];

export interface ErroDeCalendario {
  readonly tipo: 'mes-sem-dia-util';
  readonly mes: MesDeApuracao;
}

// Dia útil é dia de semana que não está na lista. A lista é dado: um
// feriado novo entra como uma linha, e quem pergunta não muda.
export class CalendarioDeDiasUteis {
  readonly #naoUteis: readonly DiaNaoUtil[];

  private constructor(naoUteis: readonly DiaNaoUtil[]) {
    this.#naoUteis = naoUteis;
  }

  static com(naoUteis: readonly DiaNaoUtil[]): CalendarioDeDiasUteis {
    return new CalendarioDeDiasUteis(naoUteis);
  }

  ehDiaUtil(data: DataDoCalendario): boolean {
    return (
      !ehFimDeSemana(data) &&
      !this.#naoUteis.some((dia) => caiEm(dia, data))
    );
  }

  ultimoDiaUtil(
    mes: MesDeApuracao,
  ): Result<DataDoCalendario, ErroDeCalendario> {
    const ultimo = mes.dias().findLast((data) => this.ehDiaUtil(data));
    if (ultimo === undefined) {
      return err({ tipo: 'mes-sem-dia-util', mes });
    }
    return ok(ultimo);
  }
}

export const calendarioNacional =
  CalendarioDeDiasUteis.com(naoUteisNacionais);
// #endregion

// Domingo é 0 e sábado é 6. A data vira um instante em UTC, como no
// Capítulo 3, para que o fuso da máquina não mude o dia da semana.
function ehFimDeSemana(data: DataDoCalendario): boolean {
  const diaDaSemana = new Date(`${data}T00:00:00Z`).getUTCDay();
  return diaDaSemana === 0 || diaDaSemana === 6;
}

function caiEm(
  { diaDoAno, desde }: DiaNaoUtil,
  data: DataDoCalendario,
) {
  const ano = Number(data.slice(0, 4));
  return (
    data.slice(5) === diaDoAno && (desde === undefined || ano >= desde)
  );
}

import type { NomeDaCategoria } from '../apuracao/apuracao-do-mes.js';
import { Dinheiro } from '../dinheiro.js';
import { inspecionar, type ObjetoDeValor } from '../objeto-de-valor.js';

// #region prejuizo-acumulado
// A perda de um grupo só abate ganhos do mesmo grupo (IN RFB
// 1.585/2015, arts. 37, § 2º, 64 e 65). Grupo não é categoria: ações
// e ETF são categorias diferentes no mesmo grupo, o comum.
export type GrupoDeCompensacao = 'comum' | 'day-trade' | 'fii';

export const grupoDaCategoria: Readonly<
  Record<NomeDaCategoria, GrupoDeCompensacao>
> = {
  'acoes-comum': 'comum',
  etf: 'comum',
  'day-trade': 'day-trade',
  fii: 'fii',
};

type Saldos = Readonly<Record<GrupoDeCompensacao, Dinheiro>>;

const zero = Dinheiro.deCentavos(0n);

// O prejuízo que falta compensar, um saldo por grupo, guardado como
// valor positivo. Cada operação devolve um prejuízo novo: o do mês
// anterior continua o mesmo.
// prettier-ignore
export class PrejuizoAcumulado
  implements ObjetoDeValor<PrejuizoAcumulado>
{
  readonly #saldos: Saldos;

  private constructor(saldos: Saldos) {
    this.#saldos = saldos;
  }

  static nenhum(): PrejuizoAcumulado {
    return new PrejuizoAcumulado({
      comum: zero,
      'day-trade': zero,
      fii: zero,
    });
  }

  saldoDe(grupo: GrupoDeCompensacao): Dinheiro {
    return this.#saldos[grupo];
  }

  // Um resultado negativo soma a perda ao saldo do grupo; lucro e
  // zero não mudam nada.
  acumular(
    grupo: GrupoDeCompensacao,
    resultado: Dinheiro,
  ): PrejuizoAcumulado {
    if (!resultado.ehNegativo()) {
      return this;
    }
    const saldo = this.#saldos[grupo].subtrair(resultado);
    return new PrejuizoAcumulado({ ...this.#saldos, [grupo]: saldo });
  }
  // #endregion

  equivaleA(outro: PrejuizoAcumulado): boolean {
    return grupos.every((grupo) =>
      this.#saldos[grupo].equivaleA(outro.#saldos[grupo]),
    );
  }

  [inspecionar](): string {
    const saldos = grupos.map(
      (grupo) => `${grupo}: ${this.#saldos[grupo][inspecionar]()}`,
    );
    return `PrejuizoAcumulado(${saldos.join(', ')})`;
  }
}

const grupos: readonly GrupoDeCompensacao[] = [
  'comum',
  'day-trade',
  'fii',
];

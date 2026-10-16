import type { Dinheiro } from '../dinheiro.js';
import type {
  GrupoDeCompensacao,
  PrejuizoAcumulado,
} from '../prejuizo/prejuizo-acumulado.js';
import type { ApuracaoDoMes } from './apuracao-do-mes.js';
import type { MesDeApuracao } from './mes-de-apuracao.js';

// As colunas de um grupo num mês, como o Demonstrativo de Apuração de
// Ganhos da declaração as pede: o resultado do mês, o prejuízo até o
// mês anterior, a base de cálculo e o prejuízo que fica a compensar.
export interface GrupoNoMes {
  readonly resultado: Dinheiro;
  readonly anterior: Dinheiro;
  readonly base: Dinheiro;
  readonly aCompensar: Dinheiro;
}

export interface LinhaDoDemonstrativo {
  readonly mes: MesDeApuracao;
  readonly grupos: Readonly<Record<GrupoDeCompensacao, GrupoNoMes>>;
}

/* eslint-disable @typescript-eslint/no-unused-vars -- esboço */
// #region demonstrativo
// Desafio do Capítulo 11: o demonstrativo do ano, mês a mês, a partir
// das apurações e do prejuízo que vem do ano anterior (Perguntas e
// Respostas IRPF 2026, pergunta 711). Os testes estão em
// test/dominio/demonstrativo.test.ts.
export function demonstrativoDoAno(
  apuracoes: readonly ApuracaoDoMes[],
  doAnoAnterior: PrejuizoAcumulado,
): readonly LinhaDoDemonstrativo[] {
  throw new Error('Desafio do Capítulo 11 não resolvido');
}
// #endregion
/* eslint-enable @typescript-eslint/no-unused-vars */

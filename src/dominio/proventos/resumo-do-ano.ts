import type { DadosDeReferencia } from '../dados-de-referencia.js';
import type { Dinheiro } from '../dinheiro.js';
import type { Result } from '../resultado.js';
import type { Provento } from './provento.js';
import type { ErroDeProvento } from './tratar-provento.js';

// O que se soma no ano para cada tratamento.
export interface TotaisDoAno {
  readonly bruto: Dinheiro;
  readonly retido: Dinheiro;
  readonly liquido: Dinheiro;
}

// Os três tratamentos, como as fichas da declaração os separam: os
// isentos, os de tributação exclusiva na fonte e os dividendos com a
// retenção da Lei 15.270/2025, que antecipa um imposto do ajuste.
export type ResumoDoAno = Readonly<
  Record<
    'isento' | 'exclusivo-na-fonte' | 'retido-por-antecipacao',
    TotaisDoAno
  >
>;

/* eslint-disable @typescript-eslint/no-unused-vars -- esboço */
// #region resumo-do-ano
// Desafio do Capítulo 10: os proventos pagos num ano, somados por
// tratamento fiscal. Os testes estão em
// test/dominio/resumo-do-ano.test.ts.
export function resumoDoAno(
  proventos: readonly Provento[],
  ano: number,
  referencias: DadosDeReferencia,
): Result<ResumoDoAno, ErroDeProvento> {
  throw new Error('Desafio do Capítulo 10 não resolvido');
}
// #endregion
/* eslint-enable @typescript-eslint/no-unused-vars */

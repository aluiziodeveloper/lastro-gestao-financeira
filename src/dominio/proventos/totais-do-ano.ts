import { Dinheiro } from '../dinheiro.js';

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

export const zero = Dinheiro.deCentavos(0n);
const nada: TotaisDoAno = { bruto: zero, retido: zero, liquido: zero };
export const resumoVazio: ResumoDoAno = {
  isento: nada,
  'exclusivo-na-fonte': nada,
  'retido-por-antecipacao': nada,
};

// Soma ao tratamento o bruto e o retido de um provento ou de um grupo.
export function somar(
  resumo: ResumoDoAno,
  tratamento: keyof ResumoDoAno,
  bruto: Dinheiro,
  retido: Dinheiro,
): ResumoDoAno {
  const atual = resumo[tratamento];
  return {
    ...resumo,
    [tratamento]: {
      bruto: atual.bruto.somar(bruto),
      retido: atual.retido.somar(retido),
      liquido: atual.liquido.somar(bruto.subtrair(retido)),
    },
  };
}

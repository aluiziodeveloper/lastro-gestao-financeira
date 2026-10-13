import { describe, expect, it } from 'vitest';

import { LIMITE_EM_CENTAVOS, vendasIsentas } from './isencao-cena.js';

// #region teste-para-mutante
// O antipadrão: o teste mata o mutante do < lendo o limite do próprio
// código. Se o limite estiver errado, o teste erra junto.
describe('isenção, testada para o mutante', () => {
  it('isenta o valor do limite', () => {
    expect(vendasIsentas(LIMITE_EM_CENTAVOS)).toBe(true);
  });
});

// O teste de comportamento: o limite vem da lei, escrito no teste.
describe('isenção, testada pela regra', () => {
  it('isenta vendas de exatamente R$ 20.000,00 no mês', () => {
    expect(vendasIsentas(20_000_00n)).toBe(true);
  });

  it('tributa vendas de R$ 20.000,01 no mês', () => {
    expect(vendasIsentas(20_000_01n)).toBe(false);
  });
});
// #endregion

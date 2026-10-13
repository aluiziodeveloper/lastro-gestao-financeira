import { describe, expect, it } from 'vitest';

import { vendasIsentas } from './isencao-cena.js';

// #region isencao-cena-testes
// Os dois testes da equipe: 100% das linhas, e nenhum no limite.
describe('isenção de R$ 20 mil', () => {
  it('isenta vendas de R$ 15.000,00 no mês', () => {
    expect(vendasIsentas(15_000_00n)).toBe(true);
  });

  it('tributa vendas de R$ 25.000,00 no mês', () => {
    expect(vendasIsentas(25_000_00n)).toBe(false);
  });
});
// #endregion

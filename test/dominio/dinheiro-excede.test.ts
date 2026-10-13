import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';

// #region dinheiro-excede-teste
describe('Dinheiro.excede', () => {
  const limite = Dinheiro.deCentavos(20_000_00n);

  it('R$ 30.000,00 excede R$ 20.000,00', () => {
    expect(Dinheiro.deCentavos(30_000_00n).excede(limite)).toBe(true);
  });

  it('R$ 10.000,00 não excede R$ 20.000,00', () => {
    expect(Dinheiro.deCentavos(10_000_00n).excede(limite)).toBe(false);
  });
});
// #endregion

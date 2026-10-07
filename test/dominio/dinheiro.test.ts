import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';

// #region dinheiro-criacao-teste
describe('Dinheiro', () => {
  it('equivale a outro Dinheiro com os mesmos centavos', () => {
    expect(Dinheiro.deCentavos(1_15n)).toEqual(
      Dinheiro.deCentavos(115n),
    );
  });

  it('não equivale a um Dinheiro com centavos diferentes', () => {
    expect(Dinheiro.deCentavos(10n)).not.toEqual(
      Dinheiro.deCentavos(20n),
    );
  });

  it('compara por valor com equivaleA, e não por referência', () => {
    const umReal = Dinheiro.deCentavos(1_00n);
    expect(umReal.equivaleA(Dinheiro.deCentavos(1_00n))).toBe(true);
    expect(umReal).not.toBe(Dinheiro.deCentavos(1_00n));
  });
});
// #endregion

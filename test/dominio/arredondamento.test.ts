import { describe, expect, it } from 'vitest';

import { dividirArredondando } from '../../src/dominio/arredondamento.js';

describe('dividirArredondando', () => {
  it('trata o divisor negativo como o dividendo negativo', () => {
    expect(dividirArredondando(5n, -2n, 'meio-para-cima')).toBe(-3n);
    expect(dividirArredondando(-5n, -2n, 'meio-para-cima')).toBe(3n);
    expect(dividirArredondando(7n, -2n, 'meio-par')).toBe(-4n);
  });

  // #region arredondamento-acima-da-metade
  // Acima da metade, meio-para-cima e meio-par afastam do zero,
  // mesmo com quociente zero ou par. Casos revelados por mutantes
  // sobreviventes no Capítulo 8.
  it('arredonda 2 ÷ 3 para 1, com quociente zero', () => {
    expect(dividirArredondando(2n, 3n, 'meio-para-cima')).toBe(1n);
  });

  it('arredonda 11 ÷ 4 para 3 no meio-par, com quociente par', () => {
    expect(dividirArredondando(11n, 4n, 'meio-par')).toBe(3n);
  });
  // #endregion

  it('lança RangeError na divisão por zero', () => {
    expect(() => dividirArredondando(5n, 0n, 'truncar')).toThrow(
      RangeError,
    );
  });
});

import { describe, expect, it } from 'vitest';

import { dividirArredondando } from '../../src/dominio/arredondamento.js';

describe('dividirArredondando', () => {
  it('trata o divisor negativo como o dividendo negativo', () => {
    expect(dividirArredondando(5n, -2n, 'meio-para-cima')).toBe(-3n);
    expect(dividirArredondando(-5n, -2n, 'meio-para-cima')).toBe(3n);
    expect(dividirArredondando(7n, -2n, 'meio-par')).toBe(-4n);
  });

  it('lança RangeError na divisão por zero', () => {
    expect(() => dividirArredondando(5n, 0n, 'truncar')).toThrow(
      RangeError,
    );
  });
});

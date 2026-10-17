import { describe, expect, it } from 'vitest';

import {
  emPercentual,
  type PontosBase,
} from '../../src/dominio/mercado/pontos-base.js';

function pontos(valor: bigint): PontosBase {
  return valor as PontosBase;
}

describe('Pontos-base em percentual', () => {
  it.each([
    [825n, '8,25%'],
    [60n, '0,60%'],
    [5n, '0,05%'],
    [0n, '0,00%'],
    [10_000n, '100,00%'],
  ])('%i pontos-base são %s', (valor, esperado) => {
    expect(emPercentual(pontos(valor))).toBe(esperado);
  });
});

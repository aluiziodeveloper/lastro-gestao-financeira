import { describe, expect, it } from 'vitest';

import { err, ok } from '../../src/dominio/resultado.js';
import { extrair } from './resultado.js';

describe('extrair', () => {
  it('devolve o valor de um sucesso', () => {
    expect(extrair(ok(7))).toBe(7);
  });

  it('derruba o teste diante de um erro inesperado', () => {
    expect(() => extrair(err({ tipo: 'qualquer' }))).toThrow(
      'Result com erro inesperado: {"tipo":"qualquer"}',
    );
  });
});

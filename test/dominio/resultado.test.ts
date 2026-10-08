import { describe, expect, it } from 'vitest';

import { err, ok, type Result } from '../../src/dominio/resultado.js';

function dividirInteiros(
  dividendo: number,
  divisor: number,
): Result<number, 'divisor-zero'> {
  return divisor === 0 ? err('divisor-zero') : ok(dividendo / divisor);
}

describe('Result', () => {
  it('guarda o valor de um sucesso', () => {
    expect(ok(42)).toEqual({ ok: true, valor: 42 });
  });

  it('guarda o erro de uma falha', () => {
    expect(err('divisor-zero')).toEqual({
      ok: false,
      erro: 'divisor-zero',
    });
  });

  it('só entrega o valor depois de verificar o campo ok', () => {
    const resultado = dividirInteiros(10, 2);
    expect(resultado.ok && resultado.valor).toBe(5);
  });

  it('entrega o erro quando a operação falha', () => {
    const resultado = dividirInteiros(10, 0);
    expect(!resultado.ok && resultado.erro).toBe('divisor-zero');
  });
});

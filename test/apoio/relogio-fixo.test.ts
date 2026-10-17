import { describe, expect, it } from 'vitest';

import { relogioFixo } from './relogio-fixo.js';

describe('relogioFixo', () => {
  it('devolve sempre o mesmo instante', () => {
    const relogio = relogioFixo('2026-11-01T00:30:00Z');

    expect(relogio.agora().toISOString()).toBe(
      '2026-11-01T00:30:00.000Z',
    );
    expect(relogio.agora()).toEqual(relogio.agora());
  });

  it('quem altera o Date devolvido não muda o relógio', () => {
    const relogio = relogioFixo('2026-11-01T00:30:00Z');
    relogio.agora().setUTCFullYear(2000);

    expect(relogio.agora().toISOString()).toBe(
      '2026-11-01T00:30:00.000Z',
    );
  });

  it('recusa um instante inválido', () => {
    expect(() => relogioFixo('31/10/2026')).toThrow(
      'Instante inválido: 31/10/2026',
    );
  });
});

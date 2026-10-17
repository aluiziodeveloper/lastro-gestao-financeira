import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  inicioDaJanela,
  type RendaPorMes,
  rendaDoProximoMes,
} from './relogio-espalhado.js';

// #region relogio-falso
// O relógio falso global troca o relógio do processo inteiro: o do
// aplicativo, o do Vitest e o de qualquer biblioteca. Cada teste fixa
// o instante, e o afterEach devolve o relógio real.
const renda: RendaPorMes = { '11': 175_00n, '12': 475_00n };

describe('o aplicativo da cena, com o relógio falso', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('às 15h00 UTC de 31/10, mostra novembro', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T15:00:00Z'));

    expect(rendaDoProximoMes(renda)).toBe(175_00n);
  });

  // A falha é o objeto do exemplo: it.fails a mantém na suíte verde.
  it.fails('às 00h30 UTC de 1º/11, ainda 31/10 em SP, também', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T00:30:00Z'));

    expect(rendaDoProximoMes(renda)).toBe(175_00n);
  });

  it('o Date.now() da outra função também é o falso', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T00:30:00Z'));

    expect(inicioDaJanela().toISOString()).toBe(
      '2025-11-01T00:30:00.000Z',
    );
  });
});
// #endregion

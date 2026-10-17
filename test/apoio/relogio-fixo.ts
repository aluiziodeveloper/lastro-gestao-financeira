import type { Relogio } from '../../src/dominio/relogio.js';

// #region relogio-fixo
// O relógio dos testes: devolve sempre o mesmo instante, escrito em
// UTC, como '2026-11-01T00:30:00Z'. Cada chamada devolve um Date novo,
// e quem altera um deles não muda o relógio.
export function relogioFixo(instante: string): Relogio {
  if (Number.isNaN(new Date(instante).getTime())) {
    throw new Error(`Instante inválido: ${instante}`);
  }
  return { agora: () => new Date(instante) };
}
// #endregion

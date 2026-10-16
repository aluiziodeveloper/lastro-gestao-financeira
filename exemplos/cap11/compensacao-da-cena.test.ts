import { describe, expect, it } from 'vitest';

import { emiteDarf, impostoDoMes } from './compensacao-da-cena.js';

// #region compensacao-da-cena-testes
// Os dois erros da cena. A falha é o objeto do exemplo: it.fails a
// mantém na suíte verde.
describe('o aplicativo da cena', () => {
  const abril = [
    { classe: 'acao', resultado: 3_000_00n },
    { classe: 'fii', resultado: -3_000_00n },
  ] as const;

  it('soma os grupos: abril dá imposto zero', () => {
    expect(impostoDoMes(abril)).toBe(0n);
  });

  it.fails('cobra os R$ 450,00 das ações em abril', () => {
    expect(impostoDoMes(abril)).toBe(450_00n);
  });

  it.fails('não emite DARF de R$ 7,32', () => {
    expect(emiteDarf(7_32n)).toBe(false);
  });
});
// #endregion

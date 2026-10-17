import { describe, expect, it } from 'vitest';

import { sugerir } from './if-aninhado.js';

// #region if-aninhado-testes
// A conta da ferramenta está certa para o alvo; a margem de isenção
// não entra em nenhum dos ifs. A falha é o objeto do exemplo.
describe('a ferramenta da cena', () => {
  const acoes = 132_000_00n;
  const fii = 80_000_00n;

  it('manda vender R$ 26.000,00 de ações', () => {
    expect(sugerir(acoes, fii, 0n)).toEqual({
      vender: 'acoes',
      valor: 26_000_00n,
      comprar: 26_000_00n,
    });
  });

  it.fails('respeita a margem de R$ 17.000,00', () => {
    expect(sugerir(acoes, fii, 0n).valor).toBeLessThanOrEqual(
      17_000_00n,
    );
  });
});
// #endregion

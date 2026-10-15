import { describe, expect, it } from 'vitest';

import { impostoDoMes } from './switch-da-cena.js';

// #region switch-da-cena-testes
// As regras da IN RFB 1.585/2015 contra o switch da cena. As falhas são
// o objeto do exemplo: it.fails as mantém na suíte verde.
describe('o switch da cena', () => {
  it('acerta o ETF, que ninguém copiou', () => {
    const vendas = {
      classe: 'etf',
      totalVendido: 10_000_00n,
      lucro: 1_000_00n,
    } as const;
    expect(impostoDoMes(vendas)).toBe(150_00n);
  });

  it.fails(
    'cobra 15% do lucro inteiro com R$ 20.000,01 vendidos',
    () => {
      const vendas = {
        classe: 'acao',
        totalVendido: 20_000_01n,
        lucro: 1_200_00n,
      } as const;
      expect(impostoDoMes(vendas)).toBe(180_00n);
    },
  );

  it.fails(
    'cobra 20% do lucro de FII, mesmo abaixo de R$ 20 mil',
    () => {
      const vendas = {
        classe: 'fii',
        totalVendido: 15_000_00n,
        lucro: 1_000_00n,
      } as const;
      expect(impostoDoMes(vendas)).toBe(200_00n);
    },
  );
});
// #endregion

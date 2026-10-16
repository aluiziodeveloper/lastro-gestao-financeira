import { describe, expect, it } from 'vitest';

import {
  Aliquota,
  arredondamentoDoImposto,
} from '../../src/dominio/aliquota.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { impostoVendaAVenda } from './arredondar-cedo.js';

// #region arredondar-cedo-testes
// Cem vendas com R$ 1,03 de lucro cada. Venda a venda, 15% de 103
// centavos são 15,45, arredondados para 15; no mês, 15% de R$ 103,00
// são R$ 15,45.
const lucros = Array.from({ length: 100 }, () => 1_03n);

describe('arredondar cedo demais', () => {
  it('venda a venda, o imposto do mês dá R$ 15,00', () => {
    expect(impostoVendaAVenda(lucros)).toBe(15_00n);
  });

  it('no mês, como no Lastro, dá R$ 15,45', () => {
    const total = Dinheiro.deCentavos(1_03n * 100n);
    expect(
      Aliquota.de(15n, 100n).sobreGanho(total, arredondamentoDoImposto),
    ).toEqual(Dinheiro.deCentavos(15_45n));
  });

  it.fails('arredondar cedo dá o mesmo que no fim', () => {
    expect(impostoVendaAVenda(lucros)).toBe(15_45n);
  });
});
// #endregion

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  AcoesComum,
  type Categoria,
  DayTrade,
  type TotaisDoMes,
} from './categoria-por-heranca.js';

const umTotal: fc.Arbitrary<TotaisDoMes> = fc.record({
  totalVendido: fc.bigInt({ min: 0n, max: 100_000_00n }),
  resultado: fc.bigInt({ min: -50_000_00n, max: 50_000_00n }),
});

// #region contrato-por-heranca
// Uma cláusula do contrato do Lastro, escrita para a classe base: vale
// para toda subclasse, ou a subclasse não substitui a base.
function nuncaCobraImpostoNegativo(categoria: Categoria): void {
  fc.assert(
    fc.property(umTotal, (totais) => {
      expect(categoria.apurar(totais) >= 0n).toBe(true);
    }),
  );
}

describe('categorias por herança', () => {
  it('ações em operação comum cumprem o contrato', () => {
    nuncaCobraImpostoNegativo(new AcoesComum());
  });

  // A falha é o objeto do exemplo: it.fails a mantém na suíte verde.
  it.fails('o day trade quebra o contrato', () => {
    nuncaCobraImpostoNegativo(new DayTrade());
  });

  it('devolve -R$ 200,00 sobre R$ 1.000,00 de prejuízo', () => {
    const totais = { totalVendido: 5_000_00n, resultado: -1_000_00n };
    expect(new DayTrade().apurar(totais)).toBe(-200_00n);
  });
});
// #endregion

import { describe, expect, it } from 'vitest';

import { extrair } from '../apoio/resultado.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { valorBrutoDaOperacao } from '../../src/dominio/operacao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';

// #region operacao-valor-bruto-teste
describe('valor bruto da operação', () => {
  it('vale R$ 1.000,00 para 100 ações a R$ 10,00', () => {
    expect(
      valorBrutoDaOperacao(
        Dinheiro.deCentavos(10_00n),
        extrair(Quantidade.criar(100)),
      ),
    ).toEqual(Dinheiro.deCentavos(1_000_00n));
  });
});
// #endregion

// #region operacao-valor-bruto-centavos
describe('valor bruto da operação com centavos', () => {
  it('vale R$ 115,00 para 100 ações a R$ 1,15', () => {
    expect(
      valorBrutoDaOperacao(
        Dinheiro.deCentavos(1_15n),
        extrair(Quantidade.criar(100)),
      ),
    ).toEqual(Dinheiro.deCentavos(115_00n));
  });
});
// #endregion

import { describe, expect, it } from 'vitest';

import { valorBrutoDaOperacao } from '../../src/dominio/operacao.js';

// #region operacao-valor-bruto-teste
describe('valor bruto da operação', () => {
  it('vale R$ 1.000,00 para 100 ações a R$ 10,00', () => {
    expect(valorBrutoDaOperacao(10, 100)).toBe(1000);
  });
});
// #endregion

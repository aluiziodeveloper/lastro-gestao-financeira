import { describe, expect, it } from 'vitest';

import { valorBrutoDaOperacao } from '../../src/dominio/operacao.js';

// #region operacao-valor-bruto-teste
describe('valor bruto da operação', () => {
  it('vale R$ 1.000,00 para 100 ações a R$ 10,00', () => {
    expect(valorBrutoDaOperacao(10, 100)).toBe(1000);
  });
});
// #endregion

// #region operacao-valor-bruto-centavos
describe('valor bruto da operação com centavos em number', () => {
  // Teste de caracterização: fixa o resultado atual, que está errado.
  // O valor certo, R$ 115,00, chega com os objetos de valor.
  it('devolve 114.99999999999999 para 100 ações a R$ 1,15', () => {
    expect(valorBrutoDaOperacao(1.15, 100)).toBe(114.99999999999999);
  });
});
// #endregion

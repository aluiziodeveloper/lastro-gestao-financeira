import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { Quantidade } from '../../src/dominio/quantidade.js';

// #region dinheiro-criacao-teste
describe('Dinheiro', () => {
  it('equivale a outro Dinheiro com os mesmos centavos', () => {
    expect(Dinheiro.deCentavos(1_15n)).toEqual(
      Dinheiro.deCentavos(115n),
    );
  });

  it('não equivale a um Dinheiro com centavos diferentes', () => {
    expect(Dinheiro.deCentavos(10n)).not.toEqual(
      Dinheiro.deCentavos(20n),
    );
  });

  it('compara por valor com equivaleA, e não por referência', () => {
    const umReal = Dinheiro.deCentavos(1_00n);
    expect(umReal.equivaleA(Dinheiro.deCentavos(1_00n))).toBe(true);
    expect(umReal).not.toBe(Dinheiro.deCentavos(1_00n));
  });
});
// #endregion

// #region dinheiro-somar-subtrair-teste
describe('Dinheiro: soma e subtração', () => {
  it('soma R$ 0,10 e R$ 0,20 sem perder centavos', () => {
    const soma = Dinheiro.deCentavos(10n).somar(
      Dinheiro.deCentavos(20n),
    );
    expect(soma).toEqual(Dinheiro.deCentavos(30n));
  });

  it('subtrai R$ 0,30 de R$ 1,00', () => {
    const diferenca = Dinheiro.deCentavos(1_00n).subtrair(
      Dinheiro.deCentavos(30n),
    );
    expect(diferenca).toEqual(Dinheiro.deCentavos(70n));
  });

  it('chega a valor negativo quando subtrai mais do que tem', () => {
    const diferenca = Dinheiro.deCentavos(10n).subtrair(
      Dinheiro.deCentavos(30n),
    );
    expect(diferenca).toEqual(Dinheiro.deCentavos(-20n));
  });

  it('não altera as parcelas da operação', () => {
    const dezCentavos = Dinheiro.deCentavos(10n);
    dezCentavos.somar(Dinheiro.deCentavos(20n));
    expect(dezCentavos).toEqual(Dinheiro.deCentavos(10n));
  });
});
// #endregion

// #region dinheiro-multiplicar-teste
describe('Dinheiro: multiplicação por quantidade', () => {
  it('vale R$ 115,00 para 100 ações a R$ 1,15', () => {
    const total = Dinheiro.deCentavos(1_15n).multiplicarPor(
      Quantidade.de(100),
    );
    expect(total).toEqual(Dinheiro.deCentavos(115_00n));
  });

  it('continua exato além do maior inteiro exato de um number', () => {
    const total = Dinheiro.deCentavos(1_00n).multiplicarPor(
      Quantidade.de(Number.MAX_SAFE_INTEGER),
    );
    expect(total).toEqual(
      Dinheiro.deCentavos(9_007_199_254_740_991_00n),
    );
  });
});
// #endregion

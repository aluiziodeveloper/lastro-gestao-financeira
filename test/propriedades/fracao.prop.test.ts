import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { FracaoDeAcao } from '../../src/dominio/fracao-de-acao.js';

// #region gerador-fracao
// Os números de uma fração pendente: menos de uma ação, como sobra de
// um evento com termos de 1 a 20, e um custo de até R$ 1.000,00. A
// fração é montada no teste, e o contraexemplo mostra só os números.
interface Partes {
  readonly numerador: bigint;
  readonly denominador: bigint;
  readonly centavos: bigint;
}

const umasPartes = fc
  .integer({ min: 2, max: 20 })
  .chain((denominador) =>
    fc.record({
      numerador: fc.bigInt({ min: 1n, max: BigInt(denominador - 1) }),
      denominador: fc.constant(BigInt(denominador)),
      centavos: fc.bigInt({ min: 0n, max: 1_000_00n }),
    }),
  );

function fracao({ numerador, denominador, centavos }: Partes) {
  return FracaoDeAcao.de(
    numerador,
    denominador,
    Dinheiro.deCentavos(centavos),
  );
}
// #endregion

// #region desafio-propriedades
describe('desafio do capítulo 7 · FracaoDeAcao.somar', () => {
  it('é comutativa', () => {
    fc.assert(
      fc.property(umasPartes, umasPartes, (a, b) => {
        expect(fracao(a).somar(fracao(b))).toEqual(
          fracao(b).somar(fracao(a)),
        );
      }),
    );
  });

  it('é associativa', () => {
    fc.assert(
      fc.property(umasPartes, umasPartes, umasPartes, (a, b, c) => {
        expect(fracao(a).somar(fracao(b)).somar(fracao(c))).toEqual(
          fracao(a).somar(fracao(b).somar(fracao(c))),
        );
      }),
    );
  });

  it('soma os custos', () => {
    fc.assert(
      fc.property(umasPartes, umasPartes, (a, b) => {
        expect(fracao(a).somar(fracao(b)).custo()).toEqual(
          Dinheiro.deCentavos(a.centavos + b.centavos),
        );
      }),
    );
  });

  // O modelo de referência é a soma de frações da escola, com os
  // números crus: a/b + c/d = (a × d + c × b) / (b × d).
  it('equivale à soma de frações feita com os números', () => {
    fc.assert(
      fc.property(umasPartes, umasPartes, (a, b) => {
        const modelo = FracaoDeAcao.de(
          a.numerador * b.denominador + b.numerador * a.denominador,
          a.denominador * b.denominador,
          Dinheiro.deCentavos(a.centavos + b.centavos),
        );
        expect(fracao(a).somar(fracao(b))).toEqual(modelo);
      }),
    );
  });
});
// #endregion

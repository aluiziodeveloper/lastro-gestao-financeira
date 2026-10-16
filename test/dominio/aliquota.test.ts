import { describe, expect, it } from 'vitest';

import {
  Aliquota,
  arredondamentoDaRetencao,
  arredondamentoDoImposto,
} from '../../src/dominio/aliquota.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';

const quinzePorCento = Aliquota.de(15n, 100n);

function centavos(valor: bigint): Dinheiro {
  return Dinheiro.deCentavos(valor);
}

// #region aliquota-teste
describe('Aliquota', () => {
  it('cobra 15% de R$ 1.200,00: R$ 180,00', () => {
    expect(
      quinzePorCento.sobreGanho(
        centavos(1_200_00n),
        arredondamentoDoImposto,
      ),
    ).toEqual(centavos(180_00n));
  });

  it('arredonda meio para cima: 15% de R$ 0,10 dá R$ 0,02', () => {
    expect(
      quinzePorCento.sobreGanho(centavos(10n), arredondamentoDoImposto),
    ).toEqual(centavos(2n));
  });

  it('arredonda para baixo: 15% de R$ 0,09 dá R$ 0,01', () => {
    expect(
      quinzePorCento.sobreGanho(centavos(9n), arredondamentoDoImposto),
    ).toEqual(centavos(1n));
  });

  it('não cobra nada de um prejuízo', () => {
    expect(
      quinzePorCento.sobreGanho(
        centavos(-500_00n),
        arredondamentoDoImposto,
      ),
    ).toEqual(centavos(0n));
  });

  it('não cobra nada de um resultado zero', () => {
    expect(
      quinzePorCento.sobreGanho(centavos(0n), arredondamentoDoImposto),
    ).toEqual(centavos(0n));
  });

  it('equivale à mesma fração escrita de outro jeito', () => {
    expect(quinzePorCento).toEqual(Aliquota.de(3n, 20n));
  });

  it('não equivale a outra alíquota', () => {
    expect(quinzePorCento).not.toEqual(Aliquota.de(20n, 100n));
  });

  it('mostra a fração na mensagem de falha', () => {
    expect(() => {
      expect(quinzePorCento).toEqual(Aliquota.de(20n, 100n));
    }).toThrow(
      'expected Aliquota(15/100) to deeply equal Aliquota(20/100)',
    );
  });
});
// #endregion

// #region politica-do-imposto-teste
describe('Aliquota: a política de arredondamento', () => {
  // 15% de R$ 0,30 dá 4,5 centavos: exatamente no meio, onde os modos
  // diferem.
  it.each([
    ['meio-para-cima', 'R$ 0,05', 5n],
    ['meio-par', 'R$ 0,04', 4n],
    ['truncar', 'R$ 0,04', 4n],
  ] as const)(
    '%s: 15 por cento de R$ 0,30 dá %s',
    (modo, _texto, esperado) => {
      expect(quinzePorCento.sobre(centavos(30n), modo)).toEqual(
        centavos(esperado),
      );
    },
  );

  it('o imposto e a retenção arredondam meio para cima', () => {
    expect([arredondamentoDoImposto, arredondamentoDaRetencao]).toEqual(
      ['meio-para-cima', 'meio-para-cima'],
    );
  });
});
// #endregion

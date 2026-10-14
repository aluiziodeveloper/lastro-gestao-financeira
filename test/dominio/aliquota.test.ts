import { describe, expect, it } from 'vitest';

import { Aliquota } from '../../src/dominio/aliquota.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';

const quinzePorCento = Aliquota.de(15n, 100n);

function centavos(valor: bigint): Dinheiro {
  return Dinheiro.deCentavos(valor);
}

// #region aliquota-teste
describe('Aliquota', () => {
  it('cobra 15% de R$ 1.200,00: R$ 180,00', () => {
    expect(quinzePorCento.sobreGanho(centavos(1_200_00n))).toEqual(
      centavos(180_00n),
    );
  });

  it('arredonda meio para cima: 15% de R$ 0,10 dá R$ 0,02', () => {
    expect(quinzePorCento.sobreGanho(centavos(10n))).toEqual(
      centavos(2n),
    );
  });

  it('arredonda para baixo antes do meio: 15% de R$ 0,09 dá R$ 0,01', () => {
    expect(quinzePorCento.sobreGanho(centavos(9n))).toEqual(
      centavos(1n),
    );
  });

  it('não cobra nada de um prejuízo', () => {
    expect(quinzePorCento.sobreGanho(centavos(-500_00n))).toEqual(
      centavos(0n),
    );
  });

  it('não cobra nada de um resultado zero', () => {
    expect(quinzePorCento.sobreGanho(centavos(0n))).toEqual(
      centavos(0n),
    );
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

import { describe, expect, it } from 'vitest';

import type {
  NomeDaCategoria,
  ResultadoDaCategoria,
} from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { compensar } from '../../src/dominio/prejuizo/compensacao.js';
import { PrejuizoAcumulado } from '../../src/dominio/prejuizo/prejuizo-acumulado.js';

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

// O resultado de uma categoria no mês. O total vendido e o imposto não
// pesam na compensação: o que conta é o resultado e se o mês é isento.
function resultadoDe(
  categoria: NomeDaCategoria,
  centavos: bigint,
  isenta = false,
): ResultadoDaCategoria {
  return {
    categoria,
    totalVendido: reais(25_000_00n),
    resultado: reais(centavos),
    isenta,
    imposto: reais(0n),
  };
}

const nenhum = PrejuizoAcumulado.nenhum();

// #region compensacao-cena
describe('Compensação: abril de 2026, a cena', () => {
  const abril = compensar(
    [
      resultadoDe('acoes-comum', 3_000_00n),
      resultadoDe('fii', -3_000_00n),
    ],
    nenhum,
  );

  it('o prejuízo de FII não abate o lucro das ações', () => {
    const [acoes] = abril.bases;

    expect(acoes?.base).toEqual(reais(3_000_00n));
  });

  it('o prejuízo de FII fica guardado para os FIIs seguintes', () => {
    expect(abril.prejuizo.saldoDe('fii')).toEqual(reais(3_000_00n));
    expect(abril.prejuizo.saldoDe('comum')).toEqual(reais(0n));
  });
});
// #endregion

describe('Compensação dentro do grupo', () => {
  it('ações e ETF dividem o saldo do grupo comum, nessa ordem', () => {
    const anterior = nenhum.acumular('comum', reais(-2_000_00n));

    const marco = compensar(
      [
        resultadoDe('acoes-comum', 3_000_00n),
        resultadoDe('etf', 500_00n),
      ],
      anterior,
    );

    expect(marco.bases).toEqual([
      {
        categoria: 'acoes-comum',
        compensado: reais(2_000_00n),
        base: reais(1_000_00n),
      },
      { categoria: 'etf', compensado: reais(0n), base: reais(500_00n) },
    ]);
    expect(marco.prejuizo).toEqual(nenhum);
  });

  it('a perda do mês entra no saldo antes dos ganhos do grupo', () => {
    const mes = compensar(
      [
        resultadoDe('acoes-comum', 1_000_00n),
        resultadoDe('etf', -400_00n),
      ],
      nenhum,
    );

    expect(mes.bases[0]).toEqual({
      categoria: 'acoes-comum',
      compensado: reais(400_00n),
      base: reais(600_00n),
    });
    expect(mes.prejuizo).toEqual(nenhum);
  });

  it('o saldo maior que o ganho sobra para os meses seguintes', () => {
    const anterior = nenhum.acumular('fii', reais(-3_000_00n));

    const maio = compensar([resultadoDe('fii', 1_000_00n)], anterior);

    expect(maio.bases).toEqual([
      {
        categoria: 'fii',
        compensado: reais(1_000_00n),
        base: reais(0n),
      },
    ]);
    expect(maio.prejuizo.saldoDe('fii')).toEqual(reais(2_000_00n));
  });

  it('o prejuízo de day trade só abate day trade', () => {
    const anterior = nenhum.acumular('day-trade', reais(-500_00n));

    const mes = compensar(
      [
        resultadoDe('acoes-comum', 1_000_00n),
        resultadoDe('day-trade', 200_00n),
      ],
      anterior,
    );

    expect(mes.bases.map(({ base }) => base)).toEqual([
      reais(1_000_00n),
      reais(0n),
    ]);
    expect(mes.prejuizo.saldoDe('day-trade')).toEqual(reais(300_00n));
  });
});

describe('Compensação em mês isento (IN, art. 59, § 1º)', () => {
  const anterior = nenhum.acumular('comum', reais(-2_000_00n));

  it('o ganho isento não consome o prejuízo', () => {
    const fevereiro = compensar(
      [resultadoDe('acoes-comum', 1_000_00n, true)],
      anterior,
    );

    expect(fevereiro.bases).toEqual([
      {
        categoria: 'acoes-comum',
        compensado: reais(0n),
        base: reais(0n),
      },
    ]);
    expect(fevereiro.prejuizo).toEqual(anterior);
  });

  it('a perda de um mês isento entra no saldo', () => {
    const mes = compensar(
      [resultadoDe('acoes-comum', -500_00n, true)],
      anterior,
    );

    expect(mes.prejuizo.saldoDe('comum')).toEqual(reais(2_500_00n));
  });
});

describe('PrejuizoAcumulado.compensar', () => {
  const anterior = nenhum.acumular('comum', reais(-1_000_00n));

  it.each([
    ['prejuízo', -300_00n],
    ['zero', 0n],
  ])('%s não consome o saldo', (_caso, centavos) => {
    expect(anterior.compensar('comum', reais(centavos))).toEqual({
      compensado: reais(0n),
      prejuizo: anterior,
    });
  });

  it('o ganho igual ao saldo zera o grupo', () => {
    expect(anterior.compensar('comum', reais(1_000_00n))).toEqual({
      compensado: reais(1_000_00n),
      prejuizo: nenhum,
    });
  });
});

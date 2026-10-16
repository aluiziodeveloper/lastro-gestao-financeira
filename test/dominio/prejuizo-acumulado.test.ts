import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { inspecionar } from '../../src/dominio/objeto-de-valor.js';
import {
  grupoDaCategoria,
  PrejuizoAcumulado,
} from '../../src/dominio/prejuizo/prejuizo-acumulado.js';

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

// #region prejuizo-acumulado-teste
describe('Grupo de compensação de cada categoria', () => {
  it.each([
    ['acoes-comum', 'comum'],
    ['etf', 'comum'],
    ['day-trade', 'day-trade'],
    ['fii', 'fii'],
  ] as const)('%s compensa no grupo %s', (categoria, grupo) => {
    expect(grupoDaCategoria[categoria]).toBe(grupo);
  });
});

describe('PrejuizoAcumulado: um saldo por grupo', () => {
  const nenhum = PrejuizoAcumulado.nenhum();

  it('começa sem prejuízo em nenhum grupo', () => {
    expect(nenhum.saldoDe('comum')).toEqual(reais(0n));
    expect(nenhum.saldoDe('day-trade')).toEqual(reais(0n));
    expect(nenhum.saldoDe('fii')).toEqual(reais(0n));
  });

  it('guarda a perda de FII só no grupo do FII', () => {
    const abril = nenhum.acumular('fii', reais(-3_000_00n));

    expect(abril.saldoDe('fii')).toEqual(reais(3_000_00n));
    expect(abril.saldoDe('comum')).toEqual(reais(0n));
    expect(abril.saldoDe('day-trade')).toEqual(reais(0n));
  });

  it('soma as perdas de meses seguidos no mesmo grupo', () => {
    const doisMeses = nenhum
      .acumular('comum', reais(-2_000_00n))
      .acumular('comum', reais(-500_00n));

    expect(doisMeses.saldoDe('comum')).toEqual(reais(2_500_00n));
  });

  it.each([
    ['lucro', 1_000_00n],
    ['zero', 0n],
  ])('%s não muda o saldo', (_caso, centavos) => {
    const comPerda = nenhum.acumular('day-trade', reais(-100_00n));

    expect(comPerda.acumular('day-trade', reais(centavos))).toEqual(
      comPerda,
    );
  });

  it('devolve um prejuízo novo e não altera o anterior', () => {
    nenhum.acumular('comum', reais(-1_00n));

    expect(nenhum).toEqual(PrejuizoAcumulado.nenhum());
  });
});
// #endregion

describe('PrejuizoAcumulado: igualdade e mensagens', () => {
  const nenhum = PrejuizoAcumulado.nenhum();

  it.each(['comum', 'day-trade', 'fii'] as const)(
    'difere quando só o saldo de %s difere',
    (grupo) => {
      expect(nenhum.acumular(grupo, reais(-1n))).not.toEqual(nenhum);
    },
  );

  it('mostra os três saldos quando um teste falha', () => {
    const comum = nenhum.acumular('comum', reais(-5_00n));

    expect(comum[inspecionar]()).toBe(
      'PrejuizoAcumulado(comum: Dinheiro(500 centavos), ' +
        'day-trade: Dinheiro(0 centavos), fii: Dinheiro(0 centavos))',
    );
  });
});

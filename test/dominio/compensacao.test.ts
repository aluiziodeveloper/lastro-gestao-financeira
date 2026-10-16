import { describe, expect, it } from 'vitest';

import type {
  NomeDaCategoria,
  ResultadoDaCategoria,
} from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { categoriasDo } from '../../src/dominio/apuracao/categorias.js';
import type { Lancamento } from '../../src/dominio/apuracao/lancamentos.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  type Compensacao,
  compensar,
} from '../../src/dominio/prejuizo/compensacao.js';
import { PrejuizoAcumulado } from '../../src/dominio/prejuizo/prejuizo-acumulado.js';
import { regrasEm } from './referencias.js';

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

// As vendas de uma categoria no mês. Acima de R$ 20 mil vendidos, as
// ações não são isentas; a isenção vem das regras do regime.
function vendas(
  categoria: NomeDaCategoria,
  resultado: bigint,
  totalVendido = 25_000_00n,
): Lancamento {
  return {
    categoria,
    totalVendido: reais(totalVendido),
    resultado: reais(resultado),
  };
}

const categorias = categoriasDo(regrasEm('2026-04-01'));
const nenhum = PrejuizoAcumulado.nenhum();

function daCategoria(
  compensacao: Compensacao,
  nome: NomeDaCategoria,
): ResultadoDaCategoria | undefined {
  return compensacao.categorias.find(
    ({ categoria }) => categoria === nome,
  );
}

// #region compensacao-cena
describe('Compensação: abril de 2026, a cena', () => {
  const abril = compensar(
    categorias,
    [vendas('acoes-comum', 3_000_00n), vendas('fii', -3_000_00n)],
    nenhum,
  );

  it('o prejuízo de FII não abate o lucro das ações', () => {
    const acoes = daCategoria(abril, 'acoes-comum');

    expect(acoes?.base).toEqual(reais(3_000_00n));
    expect(acoes?.imposto).toEqual(reais(450_00n));
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
      categorias,
      [vendas('acoes-comum', 3_000_00n), vendas('etf', 500_00n)],
      anterior,
    );

    const acoes = daCategoria(marco, 'acoes-comum');
    const etf = daCategoria(marco, 'etf');
    expect(acoes?.compensado).toEqual(reais(2_000_00n));
    expect(acoes?.imposto).toEqual(reais(150_00n));
    expect(etf?.compensado).toEqual(reais(0n));
    expect(etf?.imposto).toEqual(reais(75_00n));
    expect(marco.prejuizo).toEqual(nenhum);
  });

  it('a perda do mês entra no saldo antes dos ganhos do grupo', () => {
    const mes = compensar(
      categorias,
      [vendas('acoes-comum', 1_000_00n), vendas('etf', -400_00n)],
      nenhum,
    );

    expect(daCategoria(mes, 'acoes-comum')?.base).toEqual(
      reais(600_00n),
    );
    expect(mes.prejuizo).toEqual(nenhum);
  });

  it('o saldo maior que o ganho sobra para os meses seguintes', () => {
    const anterior = nenhum.acumular('fii', reais(-3_000_00n));

    const maio = compensar(
      categorias,
      [vendas('fii', 1_000_00n)],
      anterior,
    );

    expect(daCategoria(maio, 'fii')?.imposto).toEqual(reais(0n));
    expect(maio.prejuizo.saldoDe('fii')).toEqual(reais(2_000_00n));
  });

  it('o prejuízo de day trade só abate day trade', () => {
    const anterior = nenhum.acumular('day-trade', reais(-500_00n));

    const mes = compensar(
      categorias,
      [vendas('acoes-comum', 1_000_00n), vendas('day-trade', 200_00n)],
      anterior,
    );

    expect(daCategoria(mes, 'acoes-comum')?.base).toEqual(
      reais(1_000_00n),
    );
    expect(daCategoria(mes, 'day-trade')?.base).toEqual(reais(0n));
    expect(mes.prejuizo.saldoDe('day-trade')).toEqual(reais(300_00n));
  });

  it('devolve as quatro categorias, na ordem, mesmo sem vendas', () => {
    const vazio = compensar(categorias, [], nenhum);

    expect(vazio.categorias.map(({ categoria }) => categoria)).toEqual([
      'acoes-comum',
      'day-trade',
      'fii',
      'etf',
    ]);
    expect(vazio.prejuizo).toEqual(nenhum);
  });
});

describe('Compensação em mês isento (IN, art. 59, § 1º)', () => {
  const anterior = nenhum.acumular('comum', reais(-2_000_00n));

  it('o ganho isento não consome o prejuízo', () => {
    const fevereiro = compensar(
      categorias,
      [vendas('acoes-comum', 1_000_00n, 15_000_00n)],
      anterior,
    );

    const acoes = daCategoria(fevereiro, 'acoes-comum');
    expect(acoes?.isenta).toBe(true);
    expect(acoes?.compensado).toEqual(reais(0n));
    expect(acoes?.base).toEqual(reais(0n));
    expect(fevereiro.prejuizo).toEqual(anterior);
  });

  it('a perda de um mês isento entra no saldo', () => {
    const mes = compensar(
      categorias,
      [vendas('acoes-comum', -500_00n, 15_000_00n)],
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

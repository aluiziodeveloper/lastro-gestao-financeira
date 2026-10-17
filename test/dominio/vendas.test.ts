import { describe, expect, it } from 'vitest';

import type { MovimentoDoMes } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { apurarMes } from '../../src/dominio/apuracao/apuracao-mensal.js';
import { estadoInicial } from '../../src/dominio/apuracao/estado-da-apuracao.js';
import type { Composicao } from '../../src/dominio/alocacao/composicao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { nenhumValor } from '../../src/dominio/rebalanceamento/sugestao.js';
import {
  margemDeIsencao,
  rebalancear,
} from '../../src/dominio/rebalanceamento/vendas.js';
import { extrair } from '../apoio/resultado.js';
import { carteiraCom } from './carteira-de-renda.js';
import {
  alocacaoDaCena,
  catalogoDaCena,
} from './carteira-desenquadrada.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes, referenciasCom, regrasEm } from './referencias.js';

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

function composicao(acao: bigint, fii: bigint): Composicao {
  return {
    total: reais(acao + fii),
    porClasse: { acao: reais(acao), fii: reais(fii), etf: reais(0n) },
  };
}

const daCena = composicao(132_000_00n, 80_000_00n);
const regrasDeOutubro = regrasEm('2026-10-20');

describe('Margem de isenção', () => {
  it.each([
    [3_000_00n, 17_000_00n, 'a cena'],
    [0n, 20_000_00n, 'nada vendido'],
    [20_000_00n, 0n, 'o limite exato'],
    [20_000_01n, 0n, 'um centavo acima do limite'],
  ])('vendidos %i centavos, sobram %i (%s)', (vendido, margem) => {
    expect(margemDeIsencao(regrasDeOutubro, reais(vendido))).toEqual(
      reais(margem),
    );
  });

  it('sem isenção no regime, não há margem', () => {
    const semIsencao = {
      ...regrasDeOutubro,
      'acoes-comum': {
        aliquota: regrasDeOutubro['acoes-comum'].aliquota,
      },
    };

    expect(margemDeIsencao(semIsencao, reais(0n))).toEqual(reais(0n));
  });
});

// #region vendas-na-margem-teste
describe('Rebalanceamento com vendas na margem', () => {
  it('a cena: vende R$ 17.000,00 de ações, e não R$ 26.000,00', () => {
    const sugestao = rebalancear(daCena, alocacaoDaCena, {
      aporte: reais(0n),
      margem: reais(17_000_00n),
    });

    expect(sugestao.vendas).toEqual({
      ...nenhumValor,
      acao: reais(17_000_00n),
    });
    expect(sugestao.compras).toEqual({
      ...nenhumValor,
      fii: reais(17_000_00n),
    });
  });

  it('com margem maior que o excesso, vende só o excesso', () => {
    const sugestao = rebalancear(daCena, alocacaoDaCena, {
      aporte: reais(0n),
      margem: reais(30_000_00n),
    });

    expect(sugestao.vendas.acao).toEqual(reais(26_000_00n));
  });

  it('o aporte entra com a venda e diminui o excesso', () => {
    const sugestao = rebalancear(daCena, alocacaoDaCena, {
      aporte: reais(10_000_00n),
      margem: reais(17_000_00n),
    });

    expect(sugestao.vendas.acao).toEqual(reais(17_000_00n));
    expect(sugestao.compras.fii).toEqual(reais(27_000_00n));
  });

  it('dentro da banda, não vende', () => {
    const naBanda = composicao(54_000_00n, 46_000_00n);

    const sugestao = rebalancear(naBanda, alocacaoDaCena, {
      aporte: reais(0n),
      margem: reais(17_000_00n),
    });

    expect(sugestao.vendas).toEqual(nenhumValor);
  });

  it('FII acima: não vende FII, e o aporte compra ações', () => {
    const muitoFii = composicao(40_000_00n, 60_000_00n);

    const sugestao = rebalancear(muitoFii, alocacaoDaCena, {
      aporte: reais(5_000_00n),
      margem: reais(17_000_00n),
    });

    expect(sugestao.vendas).toEqual(nenhumValor);
    expect(sugestao.compras.acao).toEqual(reais(5_000_00n));
  });
});
// #endregion

describe('A cena na apuração de outubro de 2026', () => {
  const agosto = carteiraCom([
    umaCompra({
      ticker: 'PETR4',
      data: '2026-08-03',
      quantidade: 2_600,
      precoEmCentavos: 25_00n,
    }),
    umaCompra({
      ticker: 'ITUB4',
      data: '2026-08-03',
      quantidade: 1_050,
      precoEmCentavos: 30_00n,
    }),
  ]);
  const vendaDoDia5 = umaVenda({
    ticker: 'PETR4',
    data: '2026-10-05',
    quantidade: 100,
    precoEmCentavos: 30_00n,
  });

  function impostoDeOutubro(acoesVendidas: number): Dinheiro {
    const outubro: MovimentoDoMes = {
      mes: mes('2026-10'),
      operacoes: [
        vendaDoDia5,
        umaVenda({
          ticker: 'ITUB4',
          data: '2026-10-20',
          quantidade: acoesVendidas,
          precoEmCentavos: 40_00n,
        }),
      ],
      retencoes: [],
    };
    return extrair(
      apurarMes(
        estadoInicial(agosto),
        outubro,
        referenciasCom(catalogoDaCena),
      ),
    ).imposto;
  }

  it('a venda da ferramenta, 650 ITUB4, paga imposto', () => {
    expect(impostoDeOutubro(650)).toEqual(reais(1_050_00n));
  });

  it('a do Lastro, 425 ITUB4, fecha o mês em R$ 20.000,00, isento', () => {
    expect(impostoDeOutubro(425)).toEqual(reais(0n));
  });
});

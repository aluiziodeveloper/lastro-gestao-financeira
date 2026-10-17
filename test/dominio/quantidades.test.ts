import { describe, expect, it } from 'vitest';

import { AlocacaoAlvo } from '../../src/dominio/alocacao/alocacao-alvo.js';
import type { Composicao } from '../../src/dominio/alocacao/composicao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { pontosBase } from '../../src/dominio/mercado/pontos-base.js';
import { rebalancear } from '../../src/dominio/rebalanceamento/rebalanceamento.js';
import { extrair } from '../apoio/resultado.js';
import {
  alocacaoDaCena,
  representantesDaCena,
  ticker,
} from './carteira-desenquadrada.js';

const reais = (centavos: bigint): Dinheiro =>
  Dinheiro.deCentavos(centavos);

function composicao(acao: bigint, fii: bigint): Composicao {
  return {
    total: reais(acao + fii),
    porClasse: { acao: reais(acao), fii: reais(fii), etf: reais(0n) },
  };
}

const daCena = composicao(132_000_00n, 80_000_00n);

function recursos(aporte: bigint, margem: bigint) {
  return { aporte: reais(aporte), margem: reais(margem) };
}

// #region quantidades-inteiras-teste
describe('Quantidades inteiras', () => {
  it('a cena: 425 ITUB4 vendidas, 106 HGLG11 compradas', () => {
    const sugestao = rebalancear(
      daCena,
      alocacaoDaCena,
      recursos(0n, 17_000_00n),
      representantesDaCena,
    );

    expect(sugestao.ordens).toEqual([
      {
        tipo: 'venda',
        ticker: ticker('ITUB4'),
        quantidade: 425n,
        valor: reais(17_000_00n),
      },
      {
        tipo: 'compra',
        ticker: ticker('HGLG11'),
        quantidade: 106n,
        valor: reais(16_960_00n),
      },
    ]);
    expect(sugestao.caixa).toEqual(reais(40_00n));
    expect(sugestao.semRepresentante).toEqual([]);
  });

  it('a venda arredonda para baixo e nunca passa da margem', () => {
    const sugestao = rebalancear(
      daCena,
      alocacaoDaCena,
      recursos(0n, 17_039_99n),
      representantesDaCena,
    );

    expect(sugestao.vendas.acao).toEqual(reais(17_000_00n));
  });

  it('o aporte menor que uma unidade fica em caixa', () => {
    const naBanda = composicao(50_000_00n, 50_000_00n);

    const sugestao = rebalancear(
      naBanda,
      alocacaoDaCena,
      recursos(30_00n, 0n),
      representantesDaCena,
    );

    expect(sugestao.ordens).toEqual([]);
    expect(sugestao.caixa).toEqual(reais(30_00n));
  });

  it('sem representante das ações, não vende e diz por quê', () => {
    const soFii = {
      fii: { ticker: ticker('HGLG11'), preco: reais(160_00n) },
    };

    const sugestao = rebalancear(
      daCena,
      alocacaoDaCena,
      recursos(0n, 17_000_00n),
      soFii,
    );

    expect(sugestao.ordens).toEqual([]);
    expect(sugestao.semRepresentante).toEqual(['acao']);
  });

  it('a compra de uma classe sem representante volta ao caixa', () => {
    const comEtf = extrair(
      AlocacaoAlvo.criar([
        {
          classe: 'acao',
          alvo: pontosBase(4_000n),
          banda: pontosBase(0n),
        },
        {
          classe: 'fii',
          alvo: pontosBase(4_000n),
          banda: pontosBase(0n),
        },
        {
          classe: 'etf',
          alvo: pontosBase(2_000n),
          banda: pontosBase(0n),
        },
      ]),
    );

    const sugestao = rebalancear(
      daCena,
      comEtf,
      recursos(10_000_00n, 0n),
      representantesDaCena,
    );

    expect(sugestao.semRepresentante).toEqual(['etf']);
    expect(sugestao.caixa).toEqual(reais(10_000_00n));
  });
});
// #endregion

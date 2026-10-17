import { describe, expect, it } from 'vitest';

import { AlocacaoAlvo } from '../../src/dominio/alocacao/alocacao-alvo.js';
import type { Composicao } from '../../src/dominio/alocacao/composicao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { pontosBase } from '../../src/dominio/mercado/pontos-base.js';
import { porAporte } from '../../src/dominio/rebalanceamento/aportes.js';
import { nenhumValor } from '../../src/dominio/rebalanceamento/sugestao.js';
import { extrair } from '../apoio/resultado.js';
import {
  alocacaoDaCena,
  representantesDaCena,
  ticker,
} from './carteira-desenquadrada.js';

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

function composicao(acao: bigint, fii: bigint, etf = 0n): Composicao {
  return {
    total: reais(acao + fii + etf),
    porClasse: { acao: reais(acao), fii: reais(fii), etf: reais(etf) },
  };
}

const daCena = composicao(132_000_00n, 80_000_00n);

// #region por-aporte-teste
describe('Rebalanceamento por aporte', () => {
  it('a cena: R$ 10.000,00 compram 62 HGLG11', () => {
    const sugestao = porAporte(
      daCena,
      alocacaoDaCena,
      reais(10_000_00n),
      representantesDaCena,
    );

    expect(sugestao.compras).toEqual({
      ...nenhumValor,
      fii: reais(9_920_00n),
    });
    expect(sugestao.caixa).toEqual(reais(80_00n));
    expect(sugestao.ordens).toEqual([
      {
        tipo: 'compra',
        ticker: ticker('HGLG11'),
        quantidade: 62n,
        valor: reais(9_920_00n),
      },
    ]);
  });

  it('um aporte maior completa as duas classes até o alvo', () => {
    const sugestao = porAporte(
      daCena,
      alocacaoDaCena,
      reais(100_000_00n),
      representantesDaCena,
    );

    expect(sugestao.compras).toEqual({
      ...nenhumValor,
      acao: reais(24_000_00n),
      fii: reais(76_000_00n),
    });
  });

  it('a maior falta recebe primeiro', () => {
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
    const comBova11 = {
      ...representantesDaCena,
      etf: { ticker: ticker('BOVA11'), preco: reais(100_00n) },
    };

    const sugestao = porAporte(
      daCena,
      comEtf,
      reais(10_000_00n),
      comBova11,
    );

    expect(sugestao.compras).toEqual({
      ...nenhumValor,
      etf: reais(10_000_00n),
    });
  });

  it('o que não forma uma unidade passa à classe seguinte', () => {
    // Com R$ 100,00 de ETF, acima do alvo zero, as faltas somam mais
    // que o aporte. O FII falta R$ 280,00 e compra uma cota de
    // R$ 160,00; os R$ 140,00 que sobram cobrem os R$ 120,00 das ações.
    const trintaSetenta = extrair(
      AlocacaoAlvo.criar([
        {
          classe: 'acao',
          alvo: pontosBase(3_000n),
          banda: pontosBase(0n),
        },
        {
          classe: 'fii',
          alvo: pontosBase(7_000n),
          banda: pontosBase(0n),
        },
      ]),
    );
    const centavoPorAcao = {
      ...representantesDaCena,
      acao: { ticker: ticker('ITUB4'), preco: reais(1n) },
    };

    const sugestao = porAporte(
      composicao(0n, 0n, 100_00n),
      trintaSetenta,
      reais(300_00n),
      centavoPorAcao,
    );

    expect(sugestao.compras).toEqual({
      ...nenhumValor,
      fii: reais(160_00n),
      acao: reais(120_00n),
    });
    expect(sugestao.caixa).toEqual(reais(20_00n));
  });

  it('o valor-alvo trunca o centavo, e ele fica em caixa', () => {
    const umCentavo = {
      acao: { ticker: ticker('ITUB4'), preco: reais(1n) },
      fii: { ticker: ticker('HGLG11'), preco: reais(1n) },
    };

    const sugestao = porAporte(
      composicao(0n, 0n),
      alocacaoDaCena,
      reais(100_03n),
      umCentavo,
    );

    expect(sugestao.compras).toEqual({
      ...nenhumValor,
      acao: reais(50_01n),
      fii: reais(50_01n),
    });
    expect(sugestao.caixa).toEqual(reais(1n));
  });

  it('sem aporte, não compra nada', () => {
    const sugestao = porAporte(
      daCena,
      alocacaoDaCena,
      reais(0n),
      representantesDaCena,
    );

    expect(sugestao.ordens).toEqual([]);
    expect(sugestao.caixa).toEqual(reais(0n));
  });
});
// #endregion

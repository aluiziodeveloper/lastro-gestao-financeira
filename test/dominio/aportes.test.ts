import { describe, expect, it } from 'vitest';

import { AlocacaoAlvo } from '../../src/dominio/alocacao/alocacao-alvo.js';
import type { Composicao } from '../../src/dominio/alocacao/composicao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { pontosBase } from '../../src/dominio/mercado/pontos-base.js';
import { porAporte } from '../../src/dominio/rebalanceamento/aportes.js';
import { nenhumValor } from '../../src/dominio/rebalanceamento/sugestao.js';
import { extrair } from '../apoio/resultado.js';
import { alocacaoDaCena } from './carteira-desenquadrada.js';

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
  it('a cena: R$ 10.000,00 vão todos para FII', () => {
    expect(
      porAporte(daCena, alocacaoDaCena, reais(10_000_00n)),
    ).toEqual({
      compras: { ...nenhumValor, fii: reais(10_000_00n) },
      vendas: nenhumValor,
      caixa: reais(0n),
    });
  });

  it('um aporte maior completa as duas classes até o alvo', () => {
    const sugestao = porAporte(
      daCena,
      alocacaoDaCena,
      reais(100_000_00n),
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

    const sugestao = porAporte(daCena, comEtf, reais(10_000_00n));

    expect(sugestao.compras).toEqual({
      ...nenhumValor,
      etf: reais(10_000_00n),
    });
  });

  it('o centavo que o alvo truncado não alcança fica em caixa', () => {
    const vazia = composicao(0n, 0n);

    const sugestao = porAporte(vazia, alocacaoDaCena, reais(100_03n));

    expect(sugestao.compras).toEqual({
      ...nenhumValor,
      acao: reais(50_01n),
      fii: reais(50_01n),
    });
    expect(sugestao.caixa).toEqual(reais(1n));
  });

  it('sem aporte, não compra nada', () => {
    expect(porAporte(daCena, alocacaoDaCena, reais(0n))).toEqual({
      compras: nenhumValor,
      vendas: nenhumValor,
      caixa: reais(0n),
    });
  });
});
// #endregion

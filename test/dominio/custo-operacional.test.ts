import { describe, expect, it } from 'vitest';

import type { Composicao } from '../../src/dominio/alocacao/composicao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { pontosBase } from '../../src/dominio/mercado/pontos-base.js';
import {
  rebalancearComCusto,
  semOrdensCaras,
} from '../../src/dominio/rebalanceamento/custo-operacional.js';
import { rebalancear } from '../../src/dominio/rebalanceamento/rebalanceamento.js';
import {
  nenhumValor,
  propostaVazia,
} from '../../src/dominio/rebalanceamento/sugestao.js';
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

// R$ 10,00 por ordem, até 0,10% do valor movimentado.
const dezReaisAteUmDecimo = {
  porOrdem: reais(10_00n),
  limite: pontosBase(10n),
};

describe('Desafio · custo operacional', () => {
  it('a cena: as duas ordens valem o custo e ficam', () => {
    const recursos = { aporte: reais(0n), margem: reais(17_000_00n) };

    const comCusto = rebalancearComCusto(
      daCena,
      alocacaoDaCena,
      recursos,
      representantesDaCena,
      dezReaisAteUmDecimo,
    );

    expect(comCusto).toEqual(
      rebalancear(
        daCena,
        alocacaoDaCena,
        recursos,
        representantesDaCena,
      ),
    );
  });

  it('uma compra pequena é descartada, e o dinheiro fica em caixa', () => {
    const naBanda = composicao(50_000_00n, 50_000_00n);
    const recursos = { aporte: reais(400_00n), margem: reais(0n) };

    const sugestao = rebalancearComCusto(
      naBanda,
      alocacaoDaCena,
      recursos,
      representantesDaCena,
      dezReaisAteUmDecimo,
    );

    expect(sugestao.ordens).toEqual([]);
    expect(sugestao.caixa).toEqual(reais(400_00n));
  });

  it('uma venda pequena é descartada antes de financiar compras', () => {
    const recursos = { aporte: reais(0n), margem: reais(1_000_00n) };

    const sugestao = rebalancearComCusto(
      daCena,
      alocacaoDaCena,
      recursos,
      representantesDaCena,
      { porOrdem: reais(10_00n), limite: pontosBase(50n) },
    );

    expect(sugestao.ordens).toEqual([]);
    expect(sugestao.vendas.acao).toEqual(reais(0n));
    expect(sugestao.caixa).toEqual(reais(0n));
  });

  it('o custo exatamente no limite fica', () => {
    // 425 ITUB4 por R$ 17.000,00: 0,10% é R$ 17,00.
    const recursos = { aporte: reais(0n), margem: reais(17_000_00n) };

    const sugestao = rebalancearComCusto(
      daCena,
      alocacaoDaCena,
      recursos,
      representantesDaCena,
      { porOrdem: reais(17_00n), limite: pontosBase(10n) },
    );

    expect(sugestao.vendas.acao).toEqual(reais(17_000_00n));
    // A compra de 106 HGLG11, R$ 16.960,00, custaria mais que 0,10%.
    expect(sugestao.ordens).toEqual([
      {
        tipo: 'venda',
        ticker: ticker('ITUB4'),
        quantidade: 425n,
        valor: reais(17_000_00n),
      },
    ]);
  });

  it('sozinha, a política tira a venda cara sem mexer no caixa', () => {
    const vendaCara = {
      ...propostaVazia,
      vendas: { ...nenhumValor, acao: reais(40_00n) },
      ordens: [
        {
          tipo: 'venda' as const,
          ticker: ticker('ITUB4'),
          quantidade: 1n,
          valor: reais(40_00n),
        },
      ],
    };
    const situacao = {
      composicao: daCena,
      alocacao: alocacaoDaCena,
      recursos: { aporte: reais(0n), margem: reais(0n) },
      representantes: representantesDaCena,
    };

    const proposta = semOrdensCaras(dezReaisAteUmDecimo)(
      situacao,
      vendaCara,
    );

    expect(proposta).toEqual(propostaVazia);
  });
});

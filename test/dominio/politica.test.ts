import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  compor,
  type PoliticaDeRebalanceamento,
  quando,
  type Situacao,
} from '../../src/dominio/rebalanceamento/politica.js';
import { vendasInteiras } from '../../src/dominio/rebalanceamento/quantidades.js';
import { propostaVazia } from '../../src/dominio/rebalanceamento/sugestao.js';
import {
  acoesAcimaDaBanda,
  venderAcoesNaMargem,
} from '../../src/dominio/rebalanceamento/vendas.js';
import {
  alocacaoDaCena,
  representantesDaCena,
} from './carteira-desenquadrada.js';

const reais = (centavos: bigint): Dinheiro =>
  Dinheiro.deCentavos(centavos);

const situacao: Situacao = {
  composicao: {
    total: reais(0n),
    porClasse: { acao: reais(0n), fii: reais(0n), etf: reais(0n) },
  },
  alocacao: alocacaoDaCena,
  recursos: { aporte: reais(0n), margem: reais(0n) },
  representantes: {},
};

// Políticas de mentira, que só mexem no caixa, para ver a ordem.
const somarUm: PoliticaDeRebalanceamento = (_, proposta) => ({
  ...proposta,
  caixa: proposta.caixa.somar(reais(1n)),
});
const dobrar: PoliticaDeRebalanceamento = (_, proposta) => ({
  ...proposta,
  caixa: proposta.caixa.somar(proposta.caixa),
});

// #region compor-politicas-teste
describe('Políticas compostas', () => {
  it('cada política recebe a proposta da anterior, em ordem', () => {
    expect(
      compor(somarUm, dobrar)(situacao, propostaVazia).caixa,
    ).toEqual(reais(2n));
    expect(
      compor(dobrar, somarUm)(situacao, propostaVazia).caixa,
    ).toEqual(reais(1n));
  });

  it('sem políticas, a proposta passa como veio', () => {
    expect(compor()(situacao, propostaVazia)).toBe(propostaVazia);
  });

  it('quando a especificação não vale, a política não age', () => {
    const nunca = quando(() => false, somarUm);
    const sempre = quando(() => true, somarUm);

    expect(nunca(situacao, propostaVazia)).toBe(propostaVazia);
    expect(sempre(situacao, propostaVazia).caixa).toEqual(reais(1n));
  });
});
// #endregion

// #region politicas-isoladas-teste
describe('As políticas do Lastro, uma a uma', () => {
  function situacaoCom(acoes: bigint, fii: bigint): Situacao {
    return {
      ...situacao,
      composicao: {
        total: reais(acoes + fii),
        porClasse: {
          acao: reais(acoes),
          fii: reais(fii),
          etf: reais(0n),
        },
      },
      recursos: { aporte: reais(0n), margem: reais(17_000_00n) },
      representantes: representantesDaCena,
    };
  }

  it.each([
    [62_26n, 37_74n, true, 'ações acima'],
    [54_00n, 46_00n, false, 'dentro da banda'],
    [40_00n, 60_00n, false, 'FII acima e ações abaixo'],
  ])(
    'ações com %i de 100: acima da banda é %s (%s)',
    (acoes, fii, esperado) => {
      expect(acoesAcimaDaBanda(situacaoCom(acoes, fii))).toBe(esperado);
    },
  );

  it('vender na margem não vende ações abaixo do alvo', () => {
    const proposta = venderAcoesNaMargem(
      situacaoCom(40_00n, 60_00n),
      propostaVazia,
    );

    expect(proposta).toBe(propostaVazia);
  });

  it('vendas inteiras não mexem no caixa: só rendem menos', () => {
    const vendaQuebrada = {
      ...propostaVazia,
      vendas: { ...propostaVazia.vendas, acao: reais(17_039_99n) },
    };

    const proposta = vendasInteiras(situacaoCom(0n, 0n), vendaQuebrada);

    expect(proposta.vendas.acao).toEqual(reais(17_000_00n));
    expect(proposta.caixa).toEqual(reais(0n));
  });
});
// #endregion

import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  compor,
  type PoliticaDeRebalanceamento,
  quando,
  type Situacao,
} from '../../src/dominio/rebalanceamento/politica.js';
import { propostaVazia } from '../../src/dominio/rebalanceamento/sugestao.js';
import { alocacaoDaCena } from './carteira-desenquadrada.js';

const reais = (centavos: bigint): Dinheiro =>
  Dinheiro.deCentavos(centavos);

const situacao: Situacao = {
  composicao: {
    total: reais(0n),
    porClasse: { acao: reais(0n), fii: reais(0n), etf: reais(0n) },
  },
  alocacao: alocacaoDaCena,
  recursos: { aporte: reais(0n), margem: reais(0n) },
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

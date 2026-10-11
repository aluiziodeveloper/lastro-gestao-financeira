import { describe, expect, it } from 'vitest';

import {
  linhasDoRelatorio,
  type PosicaoNoRelatorio,
} from './relatorio-de-posicoes.js';

// Testes de caracterização: fixam o que o relatório imprime hoje,
// inclusive o que parece estranho, para que a refatoração não mude
// nada sem que alguém perceba.
const carteira: readonly PosicaoNoRelatorio[] = [
  {
    ativo: { ticker: 'petr4', classe: 'acao' },
    quantidade: 300,
    custoTotalEmCentavos: 11_154_00n,
  },
  {
    ativo: { ticker: 'HGLG11', classe: 'fii' },
    quantidade: 10,
    custoTotalEmCentavos: 1_634_50n,
  },
  {
    ativo: { ticker: 'BOVA11', classe: 'etf' },
    quantidade: 7,
    custoTotalEmCentavos: 1_000_00n,
  },
  {
    ativo: { ticker: 'VALE3', classe: 'acao' },
    quantidade: 0,
    custoTotalEmCentavos: 0n,
  },
];

describe('relatório de posições', () => {
  it('imprime uma linha por posição com ações em carteira', () => {
    expect(linhasDoRelatorio(carteira)).toHaveLength(3);
  });

  it('escreve o ticker em maiúsculas e a ação por extenso', () => {
    expect(linhasDoRelatorio(carteira)[0]).toBe(
      'PETR4 · ação · 300 × R$ 37,18',
    );
  });

  it('escreve FII em maiúsculas', () => {
    expect(linhasDoRelatorio(carteira)[1]).toBe(
      'HGLG11 · FII · 10 × R$ 163,45',
    );
  });

  it('escreve a classe do ETF como está no cadastro', () => {
    expect(linhasDoRelatorio(carteira)[2]).toBe(
      'BOVA11 · etf · 7 × R$ 142,85',
    );
  });

  it('trunca o preço médio, sem arredondar', () => {
    expect(linhasDoRelatorio(carteira)[2]).toContain('R$ 142,85');
  });

  it('separa o milhar com ponto', () => {
    expect(
      linhasDoRelatorio([
        {
          ativo: { ticker: 'ITUB4', classe: 'acao' },
          quantidade: 1,
          custoTotalEmCentavos: 1_234_56n,
        },
      ]),
    ).toEqual(['ITUB4 · ação · 1 × R$ 1.234,56']);
  });

  it('não imprime nada para uma carteira vazia', () => {
    expect(linhasDoRelatorio([])).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  dividendYield,
  emPercentual,
  type PontosBase,
} from '../../src/dominio/projecao/dividend-yield.js';
import { projetarRenda } from '../../src/dominio/projecao/renda-projetada.js';
import type { Provento } from '../../src/dominio/proventos/provento.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import {
  carteiraCom,
  carteiraDaTabela,
  comprasDaTabela,
  cotacoesDaTabela,
  data,
  proventosDaTabela,
} from './carteira-de-renda.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes } from './referencias.js';

const hglg11 = extrair(Ticker.criar('HGLG11'));
const petr4 = extrair(Ticker.criar('PETR4'));
const itub4 = extrair(Ticker.criar('ITUB4'));

const renda = projetarRenda(
  proventosDaTabela,
  carteiraDaTabela,
  mes('2026-10'),
);

function pontos(valor: bigint): PontosBase {
  return valor as PontosBase;
}

// #region dividend-yield-teste
describe('Dividend yield · a carteira da Tabela 12.1', () => {
  it.each([
    ['do HGLG11', '8,25%', [hglg11]],
    ['da PETR4', '8,33%', [petr4]],
    ['do ITUB4', '0,60%', [itub4]],
    ['das ações', '3,84%', [petr4, itub4]],
    ['da carteira', '5,65%', [hglg11, petr4, itub4]],
  ])('o yield %s é %s', (_, esperado, ativos) => {
    const yieldDosAtivos = extrair(
      dividendYield(renda, carteiraDaTabela, cotacoesDaTabela, ativos),
    );

    expect(emPercentual(yieldDosAtivos)).toBe(esperado);
  });
});
// #endregion

describe('Dividend yield · o que falta', () => {
  it('sem a cotação de um ativo pedido, não calcula', () => {
    expect(
      dividendYield(renda, carteiraDaTabela, [], [hglg11, petr4]),
    ).toEqual(err({ tipo: 'sem-cotacao', ticker: hglg11 }));
  });

  it('sem posição nos ativos pedidos, não divide por zero', () => {
    const semItub4 = carteiraCom([
      ...comprasDaTabela,
      umaVenda({
        ticker: 'ITUB4',
        data: '2026-10-05',
        quantidade: 500,
        precoEmCentavos: 40_00n,
      }),
    ]);

    expect(
      dividendYield(renda, semItub4, cotacoesDaTabela, [itub4]),
    ).toEqual(err({ tipo: 'sem-valor-de-mercado' }));
  });
});

describe('Dividend yield · arredondamento', () => {
  it('arredonda meio para cima: 1 centavo de R$ 200,00', () => {
    const umaCota = carteiraCom([
      umaCompra({
        ticker: 'HGLG11',
        data: '2025-08-01',
        quantidade: 1,
        precoEmCentavos: 160_00n,
      }),
    ]);
    const rendimento: Provento = {
      tipo: 'rendimento-de-fii',
      ticker: hglg11,
      pagamento: data('2026-05-14'),
      bruto: Dinheiro.deCentavos(1n),
      cotas: extrair(Quantidade.criar(1)),
    };
    const rendaDeUmCentavo = projetarRenda(
      [rendimento],
      umaCota,
      mes('2026-10'),
    );
    const cotacoes = [
      { ticker: hglg11, preco: Dinheiro.deCentavos(200_00n) },
    ];

    expect(
      dividendYield(rendaDeUmCentavo, umaCota, cotacoes, [hglg11]),
    ).toEqual(ok(pontos(1n)));
  });
});

describe('Pontos-base em percentual', () => {
  it.each([
    [825n, '8,25%'],
    [60n, '0,60%'],
    [5n, '0,05%'],
    [0n, '0,00%'],
    [10_000n, '100,00%'],
  ])('%i pontos-base são %s', (valor, esperado) => {
    expect(emPercentual(pontos(valor))).toBe(esperado);
  });
});

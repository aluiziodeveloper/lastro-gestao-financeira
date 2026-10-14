import { describe, expect, it } from 'vitest';

import { apurarMes } from '../../src/dominio/apuracao/apuracao-mensal.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';

const catalogo = ['PETR4', 'VALE3', 'ITUB4'].reduce(
  (catalogoParcial, codigo) =>
    catalogoParcial.com(extrair(Ticker.criar(codigo)), 'acao'),
  CatalogoDeAtivos.vazio()
    .com(extrair(Ticker.criar('HGLG11')), 'fii')
    .com(extrair(Ticker.criar('BOVA11')), 'etf'),
);

function carteiraCom(operacoes: readonly Operacao[]): Carteira {
  return operacoes.reduce(
    (carteira, operacao) => extrair(carteira.registrar(operacao)),
    Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))),
  );
}

function compra(
  ticker: string,
  data: string,
  quantidade: number,
  preco: bigint,
  custos = 0n,
) {
  return umaCompra({
    ticker,
    data,
    quantidade,
    precoEmCentavos: preco,
    custosEmCentavos: custos,
  });
}

function venda(
  ticker: string,
  data: string,
  quantidade: number,
  preco: bigint,
  custos = 0n,
) {
  return umaVenda({
    ticker,
    data,
    quantidade,
    precoEmCentavos: preco,
    custosEmCentavos: custos,
  });
}

interface Impostos {
  readonly acoesComum?: bigint;
  readonly dayTrade?: bigint;
  readonly fii?: bigint;
  readonly etf?: bigint;
}

// O imposto esperado de cada categoria, em centavos; zero se omitido.
function impostos({
  acoesComum = 0n,
  dayTrade = 0n,
  fii = 0n,
  etf = 0n,
}: Impostos): ReadonlyMap<string, bigint> {
  return new Map([
    ['acoes-comum', acoesComum],
    ['day-trade', dayTrade],
    ['fii', fii],
    ['etf', etf],
  ]);
}

// #region casos-resolvidos
// Casos calculados à mão, fora do código, com o imposto de cada
// categoria em centavos. A Tabela 9.4 traz as contas.
const casos = [
  {
    caso: 'a cena: R$ 20.000,01 vendidos, R$ 1.200,00 de lucro',
    antes: [
      compra('PETR4', '2026-02-10', 100, 32_93n, 3_00n),
      compra('VALE3', '2026-02-10', 267, 58_03n, 4_00n),
    ],
    doMes: [
      venda('PETR4', '2026-03-16', 100, 37_05n, 1_11n),
      venda('VALE3', '2026-03-16', 267, 61_03n, 4_89n),
    ],
    imposto: impostos({ acoesComum: 180_00n }),
  },
  {
    caso: 'a fronteira: R$ 20.000,00 vendidos, isentos',
    antes: [compra('ITUB4', '2026-02-10', 1_000, 15_00n)],
    doMes: [venda('ITUB4', '2026-03-16', 1_000, 20_00n)],
    imposto: impostos({}),
  },
  {
    caso: 'um mês com as quatro categorias: R$ 740,00',
    antes: [
      compra('PETR4', '2026-02-10', 800, 35_00n),
      compra('HGLG11', '2026-02-10', 100, 150_00n),
      compra('BOVA11', '2026-02-10', 200, 125_00n),
    ],
    doMes: [
      venda('PETR4', '2026-03-05', 800, 38_00n),
      compra('VALE3', '2026-03-10', 100, 61_00n),
      venda('VALE3', '2026-03-10', 100, 62_50n),
      venda('HGLG11', '2026-03-12', 100, 160_00n),
      venda('BOVA11', '2026-03-20', 200, 130_00n),
    ],
    imposto: impostos({
      acoesComum: 360_00n,
      dayTrade: 30_00n,
      fii: 200_00n,
      etf: 150_00n,
    }),
  },
  {
    caso: 'o day trade parcial, com posição anterior',
    antes: [compra('VALE3', '2026-02-10', 100, 60_00n)],
    doMes: [
      compra('VALE3', '2026-03-16', 300, 62_00n),
      venda('VALE3', '2026-03-16', 200, 63_50n),
    ],
    imposto: impostos({ dayTrade: 60_00n }),
  },
];

describe('Apuração mensal: casos resolvidos à mão', () => {
  it.each(casos)('$caso', ({ antes, doMes, imposto }) => {
    const apuracao = extrair(
      apurarMes(carteiraCom(antes), doMes, catalogo),
    );

    for (const { categoria, imposto: apurado } of apuracao.categorias) {
      expect(apurado).toEqual(
        Dinheiro.deCentavos(imposto.get(categoria) ?? -1n),
      );
    }
  });
});
// #endregion

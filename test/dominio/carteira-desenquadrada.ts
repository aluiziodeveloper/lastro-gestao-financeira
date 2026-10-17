import { AlocacaoAlvo } from '../../src/dominio/alocacao/alocacao-alvo.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import type { Cotacoes } from '../../src/dominio/mercado/cotacoes.js';
import { pontosBase } from '../../src/dominio/mercado/pontos-base.js';
import type { Representantes } from '../../src/dominio/rebalanceamento/politica.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { carteiraCom } from './carteira-de-renda.js';
import { umaCompra, umaVenda } from './construtores.js';

// #region carteira-desenquadrada
// A carteira da cena do Capítulo 13, em 20/10/2026: 2.500 PETR4, 1.050
// ITUB4 e 500 HGLG11, com R$ 3.000,00 de PETR4 vendidos no dia 5. O
// alvo é metade em ações e metade em FII, com 5 pontos de banda.
export const ticker = (texto: string): Ticker =>
  extrair(Ticker.criar(texto));

export const carteiraDaCena = carteiraCom([
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
  umaCompra({
    ticker: 'HGLG11',
    data: '2026-08-03',
    quantidade: 500,
    precoEmCentavos: 150_00n,
  }),
  umaVenda({
    ticker: 'PETR4',
    data: '2026-10-05',
    quantidade: 100,
    precoEmCentavos: 30_00n,
  }),
]);

export const cotacoesDaCena: Cotacoes = [
  { ticker: ticker('PETR4'), preco: Dinheiro.deCentavos(36_00n) },
  { ticker: ticker('ITUB4'), preco: Dinheiro.deCentavos(40_00n) },
  { ticker: ticker('HGLG11'), preco: Dinheiro.deCentavos(160_00n) },
];

export const catalogoDaCena = CatalogoDeAtivos.vazio()
  .com(ticker('PETR4'), 'acao')
  .com(ticker('ITUB4'), 'acao')
  .com(ticker('HGLG11'), 'fii');

export const alocacaoDaCena = extrair(
  AlocacaoAlvo.criar([
    {
      classe: 'acao',
      alvo: pontosBase(5_000n),
      banda: pontosBase(500n),
    },
    {
      classe: 'fii',
      alvo: pontosBase(5_000n),
      banda: pontosBase(500n),
    },
  ]),
);
// A investidora compra e vende ações por ITUB4 e FII por HGLG11.
export const representantesDaCena: Representantes = {
  acao: { ticker: ticker('ITUB4'), preco: Dinheiro.deCentavos(40_00n) },
  fii: {
    ticker: ticker('HGLG11'),
    preco: Dinheiro.deCentavos(160_00n),
  },
};
// #endregion

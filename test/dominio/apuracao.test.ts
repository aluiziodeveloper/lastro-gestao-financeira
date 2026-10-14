import { describe, expect, it } from 'vitest';

import {
  CatalogoDeAtivos,
  type ClasseDeAtivo,
} from '../../src/dominio/ativo.js';
import { apurarMes } from '../../src/dominio/apuracao/apuracao-mensal.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import { err } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';

function ticker(codigo: string): Ticker {
  return extrair(Ticker.criar(codigo));
}

function centavos(valor: bigint): Dinheiro {
  return Dinheiro.deCentavos(valor);
}

const catalogo = CatalogoDeAtivos.vazio()
  .com(ticker('PETR4'), 'acao')
  .com(ticker('VALE3'), 'acao')
  .com(ticker('ITUB4'), 'acao')
  .com(ticker('HGLG11'), 'fii');

function carteiraCom(operacoes: readonly Operacao[]): Carteira {
  return operacoes.reduce(
    (carteira, operacao) => extrair(carteira.registrar(operacao)),
    Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))),
  );
}

function apurar(
  antes: readonly Operacao[],
  doMes: readonly Operacao[],
) {
  return apurarMes(carteiraCom(antes), doMes, catalogo);
}

function acoesEmOperacaoComum(
  totalVendido: bigint,
  resultado: bigint,
  isenta: boolean,
  imposto: bigint,
) {
  return [
    {
      categoria: 'acoes-comum',
      totalVendido: centavos(totalVendido),
      resultado: centavos(resultado),
      isenta,
      imposto: centavos(imposto),
    },
  ];
}

const fevereiroDaCena = [
  umaCompra({
    ticker: 'PETR4',
    data: '2026-02-10',
    quantidade: 100,
    precoEmCentavos: 32_93n,
    custosEmCentavos: 3_00n,
  }),
  umaCompra({
    ticker: 'VALE3',
    data: '2026-02-10',
    quantidade: 267,
    precoEmCentavos: 58_03n,
    custosEmCentavos: 4_00n,
  }),
];

const marcoDaCena = [
  umaVenda({
    ticker: 'PETR4',
    data: '2026-03-16',
    quantidade: 100,
    precoEmCentavos: 37_05n,
    custosEmCentavos: 1_11n,
  }),
  umaVenda({
    ticker: 'VALE3',
    data: '2026-03-16',
    quantidade: 267,
    precoEmCentavos: 61_03n,
    custosEmCentavos: 4_89n,
  }),
];

// #region apuracao-cena
describe('Apuração mensal: ações em operação comum', () => {
  it('cobra R$ 180,00 sobre R$ 1.200,00 de lucro na cena', () => {
    const apuracao = extrair(apurar(fevereiroDaCena, marcoDaCena));

    expect(apuracao.categorias).toEqual(
      acoesEmOperacaoComum(20_000_01n, 1_200_00n, false, 180_00n),
    );
  });
});
// #endregion

// #region apuracao-isencao-fronteira
describe('R4 · isenção de R$ 20 mil · na fronteira', () => {
  it('isenta o mês com R$ 20.000,00 vendidos', () => {
    const compra = umaCompra({
      ticker: 'ITUB4',
      data: '2026-02-10',
      quantidade: 1_000,
      precoEmCentavos: 15_00n,
    });
    const venda = umaVenda({
      ticker: 'ITUB4',
      data: '2026-03-16',
      quantidade: 1_000,
      precoEmCentavos: 20_00n,
    });

    const [acoes] = extrair(apurar([compra], [venda])).categorias;

    expect(acoes?.imposto).toEqual(centavos(0n));
  });

  it('tributa todo o lucro do mês com R$ 20.000,01 vendidos', () => {
    const [acoes] = extrair(
      apurar(fevereiroDaCena, marcoDaCena),
    ).categorias;

    expect(acoes?.imposto).toEqual(centavos(180_00n));
  });
});
// #endregion

describe('Apuração mensal: resultado da venda', () => {
  const compras = [
    umaCompra({
      data: '2026-02-02',
      quantidade: 2_000,
      precoEmCentavos: 10_00n,
    }),
    umaCompra({
      data: '2026-02-03',
      quantidade: 2_000,
      precoEmCentavos: 12_00n,
    }),
  ];

  it('baixa o custo pelo preço médio da posição', () => {
    const venda = umaVenda({
      data: '2026-03-02',
      quantidade: 2_000,
      precoEmCentavos: 15_00n,
    });

    expect(extrair(apurar(compras, [venda])).categorias).toEqual(
      acoesEmOperacaoComum(30_000_00n, 8_000_00n, false, 1_200_00n),
    );
  });

  it('desconta os custos da nota de venda', () => {
    const venda = umaVenda({
      data: '2026-03-02',
      quantidade: 2_000,
      precoEmCentavos: 15_00n,
      custosEmCentavos: 5_00n,
    });

    expect(extrair(apurar(compras, [venda])).categorias).toEqual(
      acoesEmOperacaoComum(30_000_00n, 7_995_00n, false, 1_199_25n),
    );
  });

  it('guarda o prejuízo e não cobra imposto', () => {
    const venda = umaVenda({
      data: '2026-03-02',
      quantidade: 3_000,
      precoEmCentavos: 9_00n,
    });

    expect(extrair(apurar(compras, [venda])).categorias).toEqual(
      acoesEmOperacaoComum(27_000_00n, -6_000_00n, false, 0n),
    );
  });

  it('não tem resultado num mês só de compras', () => {
    const compra = umaCompra({
      data: '2026-03-02',
      quantidade: 10,
      precoEmCentavos: 13_00n,
    });

    expect(extrair(apurar(compras, [compra])).categorias).toEqual(
      acoesEmOperacaoComum(0n, 0n, true, 0n),
    );
  });

  it('devolve a carteira do fim do mês', () => {
    const venda = umaVenda({
      data: '2026-03-02',
      quantidade: 1_500,
      precoEmCentavos: 15_00n,
    });

    const { carteira } = extrair(apurar(compras, [venda]));

    expect(carteira.quantidadeDe(ticker('PETR4'))).toBe(2_500n);
  });
});

describe('Apuração mensal: erros', () => {
  it('recusa a venda de um ativo fora do catálogo', () => {
    const compra = umaCompra({
      ticker: 'BBAS3',
      data: '2026-02-02',
      quantidade: 10,
      precoEmCentavos: 30_00n,
    });
    const venda = umaVenda({
      ticker: 'BBAS3',
      data: '2026-03-02',
      quantidade: 10,
      precoEmCentavos: 31_00n,
    });

    expect(apurar([compra], [venda])).toEqual(
      err({ tipo: 'ativo-fora-do-catalogo', ticker: ticker('BBAS3') }),
    );
  });

  it('para no primeiro erro e o devolve', () => {
    const compra = umaCompra({
      data: '2026-02-02',
      quantidade: 10,
      precoEmCentavos: 30_00n,
    });
    const descoberta = umaVenda({
      ticker: 'VALE3',
      data: '2026-03-02',
      quantidade: 5,
      precoEmCentavos: 60_00n,
    });
    const valida = umaVenda({
      data: '2026-03-03',
      quantidade: 10,
      precoEmCentavos: 31_00n,
    });

    expect(apurar([compra], [descoberta, valida])).toEqual(
      err({
        tipo: 'venda-a-descoberto',
        ticker: ticker('VALE3'),
        emCarteira: undefined,
        vendida: descoberta.quantidade,
      }),
    );
  });

  it('recusa, por enquanto, a venda de cotas de FII', () => {
    const compra = umaCompra({
      ticker: 'HGLG11',
      data: '2026-02-02',
      quantidade: 10,
      precoEmCentavos: 150_00n,
    });
    const venda = umaVenda({
      ticker: 'HGLG11',
      data: '2026-03-02',
      quantidade: 10,
      precoEmCentavos: 160_00n,
    });

    expect(apurar([compra], [venda])).toEqual(
      err({
        tipo: 'classe-ainda-nao-apurada',
        classe: 'fii',
        ticker: ticker('HGLG11'),
      }),
    );
  });

  it('devolve o erro da carteira, como a venda a descoberto', () => {
    const venda = umaVenda({
      data: '2026-03-02',
      quantidade: 10,
      precoEmCentavos: 15_00n,
    });

    expect(apurar([], [venda])).toEqual(
      err({
        tipo: 'venda-a-descoberto',
        ticker: ticker('PETR4'),
        emCarteira: undefined,
        vendida: venda.quantidade,
      }),
    );
  });

  it('lança diante de uma classe que burlou o compilador', () => {
    const intrusa = 'bdr' as unknown as ClasseDeAtivo;
    const comBdr = catalogo.com(ticker('ITUB4'), intrusa);
    const compra = umaCompra({
      ticker: 'ITUB4',
      data: '2026-02-02',
      quantidade: 10,
      precoEmCentavos: 30_00n,
    });
    const venda = umaVenda({
      ticker: 'ITUB4',
      data: '2026-03-02',
      quantidade: 10,
      precoEmCentavos: 31_00n,
    });

    expect(() =>
      apurarMes(carteiraCom([compra]), [venda], comBdr),
    ).toThrow('Caso não tratado');
  });
});

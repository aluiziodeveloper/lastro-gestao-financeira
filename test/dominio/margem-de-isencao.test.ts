import { describe, expect, it } from 'vitest';

import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { margemDeIsencao } from '../../src/dominio/apuracao/margem-de-isencao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';

function ticker(codigo: string): Ticker {
  return extrair(Ticker.criar(codigo));
}

function margemDe(centavos: bigint) {
  return ok(Dinheiro.deCentavos(centavos));
}

const catalogo = CatalogoDeAtivos.vazio()
  .com(ticker('PETR4'), 'acao')
  .com(ticker('ITUB4'), 'acao')
  .com(ticker('HGLG11'), 'fii');

// R$ 12.500,00 em ações, em operação comum.
const vendaDeAcoes = umaVenda({
  ticker: 'ITUB4',
  data: '2026-03-10',
  quantidade: 500,
  precoEmCentavos: 25_00n,
});

// #region margem-de-isencao-teste
describe('desafio · margem de isenção do mês', () => {
  it('deixa os R$ 20.000,00 inteiros num mês sem vendas', () => {
    const compra = umaCompra({
      quantidade: 100,
      precoEmCentavos: 30_00n,
    });

    expect(margemDeIsencao([compra], catalogo)).toEqual(
      margemDe(20_000_00n),
    );
  });

  it('desconta o que já se vendeu de ações no mês', () => {
    expect(margemDeIsencao([vendaDeAcoes], catalogo)).toEqual(
      margemDe(7_500_00n),
    );
  });

  it('chega a zero com exatamente R$ 20.000,00 vendidos', () => {
    const venda = umaVenda({
      quantidade: 800,
      precoEmCentavos: 25_00n,
    });

    expect(margemDeIsencao([venda], catalogo)).toEqual(margemDe(0n));
  });

  it('nunca fica negativa, mesmo acima do limite', () => {
    const venda = umaVenda({
      quantidade: 1_000,
      precoEmCentavos: 25_00n,
    });

    expect(margemDeIsencao([venda], catalogo)).toEqual(margemDe(0n));
  });

  it('não desconta a venda de cotas de FII', () => {
    const vendaDeFii = umaVenda({
      ticker: 'HGLG11',
      quantidade: 100,
      precoEmCentavos: 150_00n,
    });

    expect(
      margemDeIsencao([vendaDeAcoes, vendaDeFii], catalogo),
    ).toEqual(margemDe(7_500_00n));
  });

  it('não desconta a venda em day trade', () => {
    const doDia = { ticker: 'PETR4', data: '2026-03-20' };
    const compra = umaCompra({
      ...doDia,
      quantidade: 200,
      precoEmCentavos: 30_00n,
    });
    const venda = umaVenda({
      ...doDia,
      quantidade: 200,
      precoEmCentavos: 31_00n,
    });

    expect(
      margemDeIsencao([vendaDeAcoes, compra, venda], catalogo),
    ).toEqual(margemDe(7_500_00n));
  });

  it('recusa a venda de um ativo fora do catálogo', () => {
    const venda = umaVenda({
      ticker: 'BBAS3',
      quantidade: 10,
      precoEmCentavos: 20_00n,
    });

    expect(margemDeIsencao([venda], catalogo)).toEqual(
      err({ tipo: 'ativo-fora-do-catalogo', ticker: ticker('BBAS3') }),
    );
  });
});
// #endregion

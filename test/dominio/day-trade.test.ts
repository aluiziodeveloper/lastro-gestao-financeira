import { describe, expect, it } from 'vitest';

import { separarDayTrade } from '../../src/dominio/apuracao/day-trade.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import type { Quantidade } from '../../src/dominio/quantidade.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';

const dia = '2026-03-16';

// #region day-trade-separacao
describe('R5 · day trade · separação', () => {
  it('leva ao day trade só a quantidade vendida no dia', () => {
    const compra = umaCompra({
      data: dia,
      quantidade: 300,
      precoEmCentavos: 62_00n,
    });
    const venda = umaVenda({
      data: dia,
      quantidade: 200,
      precoEmCentavos: 63_50n,
    });

    expect(separarDayTrade([compra, venda])).toEqual(
      ok({
        dayTrade: [
          umaCompra({
            data: dia,
            quantidade: 200,
            precoEmCentavos: 62_00n,
          }),
          venda,
        ],
        comum: [
          umaCompra({
            data: dia,
            quantidade: 100,
            precoEmCentavos: 62_00n,
          }),
        ],
      }),
    );
  });

  it('não junta compra e venda de dias diferentes', () => {
    const compra = umaCompra({
      data: '2026-03-13',
      quantidade: 100,
      precoEmCentavos: 62_00n,
    });
    const venda = umaVenda({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 63_50n,
    });

    expect(separarDayTrade([compra, venda])).toEqual(
      ok({ dayTrade: [], comum: [compra, venda] }),
    );
  });
});
// #endregion

describe('R5 · day trade · pareamento', () => {
  it('não junta ativos diferentes no mesmo dia', () => {
    const compra = umaCompra({
      ticker: 'VALE3',
      data: dia,
      quantidade: 100,
      precoEmCentavos: 62_00n,
    });
    const venda = umaVenda({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 37_00n,
    });

    expect(separarDayTrade([compra, venda])).toEqual(
      ok({ dayTrade: [], comum: [compra, venda] }),
    );
  });

  it('pareia também a venda que vem antes da compra', () => {
    const venda = umaVenda({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 63_50n,
    });
    const compra = umaCompra({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 62_00n,
    });

    expect(separarDayTrade([venda, compra])).toEqual(
      ok({ dayTrade: [compra, venda], comum: [] }),
    );
  });

  it('pareia os negócios na ordem e divide o último', () => {
    const primeira = umaCompra({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 61_00n,
    });
    const segunda = umaCompra({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 62_00n,
    });
    const venda = umaVenda({
      data: dia,
      quantidade: 150,
      precoEmCentavos: 63_50n,
    });

    expect(separarDayTrade([primeira, segunda, venda])).toEqual(
      ok({
        dayTrade: [
          primeira,
          umaCompra({
            data: dia,
            quantidade: 50,
            precoEmCentavos: 62_00n,
          }),
          venda,
        ],
        comum: [
          umaCompra({
            data: dia,
            quantidade: 50,
            precoEmCentavos: 62_00n,
          }),
        ],
      }),
    );
  });

  it('divide a venda quando se vende mais do que se compra no dia', () => {
    const compra = umaCompra({
      data: dia,
      quantidade: 200,
      precoEmCentavos: 62_00n,
    });
    const venda = umaVenda({
      data: dia,
      quantidade: 300,
      precoEmCentavos: 63_50n,
    });

    expect(separarDayTrade([compra, venda])).toEqual(
      ok({
        dayTrade: [
          compra,
          umaVenda({
            data: dia,
            quantidade: 200,
            precoEmCentavos: 63_50n,
          }),
        ],
        comum: [
          umaVenda({
            data: dia,
            quantidade: 100,
            precoEmCentavos: 63_50n,
          }),
        ],
      }),
    );
  });

  it('deixa fora do day trade a compra que vem depois do par', () => {
    const venda = umaVenda({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 63_50n,
    });
    const primeira = umaCompra({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 62_00n,
    });
    const segunda = umaCompra({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 61_00n,
    });

    expect(separarDayTrade([venda, primeira, segunda])).toEqual(
      ok({ dayTrade: [primeira, venda], comum: [segunda] }),
    );
  });

  it('reparte os custos na proporção da quantidade, meio para cima', () => {
    const compra = umaCompra({
      data: dia,
      quantidade: 300,
      precoEmCentavos: 62_00n,
      custosEmCentavos: 1_00n,
    });
    const venda = umaVenda({
      data: dia,
      quantidade: 200,
      precoEmCentavos: 63_50n,
    });

    expect(separarDayTrade([compra, venda])).toEqual(
      ok({
        dayTrade: [
          umaCompra({
            data: dia,
            quantidade: 200,
            precoEmCentavos: 62_00n,
            custosEmCentavos: 67n,
          }),
          venda,
        ],
        comum: [
          umaCompra({
            data: dia,
            quantidade: 100,
            precoEmCentavos: 62_00n,
            custosEmCentavos: 33n,
          }),
        ],
      }),
    );
  });

  // #region rateio-no-meio-do-centavo
  // Metade de 5 centavos são 2,5: meio para cima dá 3 ao day trade;
  // meio-par e truncar dariam 2.
  it('reparte meio para cima o centavo que cai no meio', () => {
    const compra = umaCompra({
      data: dia,
      quantidade: 2,
      precoEmCentavos: 10_00n,
      custosEmCentavos: 5n,
    });
    const venda = umaVenda({
      data: dia,
      quantidade: 1,
      precoEmCentavos: 11_00n,
    });

    const [parteDaCompra] = extrair(
      separarDayTrade([compra, venda]),
    ).dayTrade;

    expect(parteDaCompra?.custos).toEqual(Dinheiro.deCentavos(3n));
  });
  // #endregion

  it('deixa tudo como operação comum num dia sem venda', () => {
    const compras = [
      umaCompra({
        data: dia,
        quantidade: 100,
        precoEmCentavos: 62_00n,
      }),
      umaCompra({ data: dia, quantidade: 50, precoEmCentavos: 62_10n }),
    ];

    expect(separarDayTrade(compras)).toEqual(
      ok({ dayTrade: [], comum: compras }),
    );
  });
});

describe('R5 · day trade · negócios que burlaram o construtor', () => {
  const precoZero = Dinheiro.deCentavos(0n);

  it('recusa dividir uma compra que burlou o construtor', () => {
    const intrusa = {
      ...umaCompra({ data: dia, quantidade: 300, precoEmCentavos: 1n }),
      precoUnitario: precoZero,
    } as Operacao;
    const venda = umaVenda({
      data: dia,
      quantidade: 200,
      precoEmCentavos: 63_50n,
    });
    const depois = umaCompra({
      data: dia,
      quantidade: 10,
      precoEmCentavos: 62_00n,
    });
    const outroDia = umaCompra({
      data: '2026-03-17',
      quantidade: 10,
      precoEmCentavos: 62_00n,
    });

    expect(separarDayTrade([intrusa, depois, venda, outroDia])).toEqual(
      err({ tipo: 'preco-nao-positivo', precoUnitario: precoZero }),
    );
  });

  it('recusa dividir uma venda que burlou o construtor', () => {
    const compra = umaCompra({
      data: dia,
      quantidade: 200,
      precoEmCentavos: 62_00n,
    });
    const intrusa = {
      ...umaVenda({ data: dia, quantidade: 300, precoEmCentavos: 1n }),
      precoUnitario: precoZero,
    } as Operacao;

    expect(separarDayTrade([compra, intrusa])).toEqual(
      err({ tipo: 'preco-nao-positivo', precoUnitario: precoZero }),
    );
  });

  it('recusa a sobra que não cabe numa quantidade', () => {
    const forjada = {
      paraBigInt: () => 2n ** 60n,
    } as unknown as Quantidade;
    const intrusa = {
      ...umaCompra({
        data: dia,
        quantidade: 1,
        precoEmCentavos: 62_00n,
      }),
      quantidade: forjada,
    } as Operacao;
    const venda = umaVenda({
      data: dia,
      quantidade: 100,
      precoEmCentavos: 63_50n,
    });

    expect(separarDayTrade([intrusa, venda])).toEqual(
      err({
        tipo: 'quantidade-acima-do-limite',
        unidades: Number(2n ** 60n - 100n),
      }),
    );
  });
});

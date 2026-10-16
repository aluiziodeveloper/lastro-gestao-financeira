import { describe, expect, it } from 'vitest';

import type {
  ApuracaoDoMes,
  MovimentoDoMes,
} from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { apurarMes } from '../../src/dominio/apuracao/apuracao-mensal.js';
import { estadoInicial } from '../../src/dominio/apuracao/estado-da-apuracao.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { recolher } from '../../src/dominio/darf/darf.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes, referenciasCom } from './referencias.js';

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

const referencias = referenciasCom(
  CatalogoDeAtivos.vazio()
    .com(extrair(Ticker.criar('PETR4')), 'acao')
    .com(extrair(Ticker.criar('HGLG11')), 'fii'),
);
const inicial = estadoInicial(
  Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))),
);

// Compra e venda do mesmo ativo em dias diferentes do mês: uma venda
// comum, com o resultado da diferença de preço.
function compraEVenda(
  ticker: string,
  texto: string,
  quantidade: number,
  compra: bigint,
  venda: bigint,
): readonly [Operacao, Operacao] {
  return [
    umaCompra({
      ticker,
      data: `${texto}-02`,
      quantidade,
      precoEmCentavos: compra,
    }),
    umaVenda({
      ticker,
      data: `${texto}-15`,
      quantidade,
      precoEmCentavos: venda,
    }),
  ];
}

function apurar(
  texto: string,
  operacoes: readonly Operacao[],
): ApuracaoDoMes {
  const movimento: MovimentoDoMes = {
    mes: mes(texto),
    operacoes,
    retencoes: [],
  };
  return extrair(apurarMes(inicial, movimento, referencias));
}

// #region darf-casos
describe('DARF: valor e vencimento', () => {
  it('abril de 2026, a cena: R$ 450,00 até 29/5/2026', () => {
    // Lucro de R$ 3.000,00 em ações e prejuízo de R$ 3.000,00 em FII,
    // com as compras no dia 2 e as vendas no dia 15.
    const [compraDeAcoes, vendaDeAcoes] = compraEVenda(
      'PETR4',
      '2026-04',
      1_000,
      22_00n,
      25_00n,
    );
    const [compraDeFii, vendaDeFii] = compraEVenda(
      'HGLG11',
      '2026-04',
      100,
      160_00n,
      130_00n,
    );
    const abril = apurar('2026-04', [
      compraDeAcoes,
      compraDeFii,
      vendaDeAcoes,
      vendaDeFii,
    ]);

    expect(abril.recolhimento).toEqual({
      tipo: 'darf',
      darf: {
        codigo: '6015',
        periodo: mes('2026-04'),
        valor: reais(450_00n),
        vencimento: '2026-05-29',
      },
    });
  });

  it.each([
    ['2025-11', '2025-12-30', 'o 31 de dezembro não serve'],
    ['2026-06', '2026-07-31', 'o último dia é uma sexta-feira'],
    ['2026-12', '2027-01-29', 'o mês seguinte é do ano seguinte'],
  ])('o DARF de %s vence em %s (%s)', (texto, vencimento) => {
    const lucro = compraEVenda('PETR4', texto, 1_000, 22_00n, 25_00n);
    const { recolhimento } = apurar(texto, lucro);

    expect(
      recolhimento.tipo === 'darf' && recolhimento.darf.vencimento,
    ).toBe(vencimento);
  });

  it('sem imposto no mês, não há DARF', () => {
    const prejuizo = compraEVenda(
      'PETR4',
      '2026-04',
      1_000,
      25_00n,
      22_00n,
    );

    expect(apurar('2026-04', prejuizo).recolhimento).toEqual({
      tipo: 'sem-imposto',
    });
  });
});
// #endregion

describe('DARF: o valor descontado o imposto retido', () => {
  const vencimento = extrair(criarDataDoCalendario('2026-07-31'));

  it('cobra o devido, depois de deduzido o retido', () => {
    expect(
      recolher(mes('2026-06'), reais(190_00n), vencimento),
    ).toEqual({
      tipo: 'darf',
      darf: {
        codigo: '6015',
        periodo: mes('2026-06'),
        valor: reais(190_00n),
        vencimento,
      },
    });
  });

  it('nada a recolher quando o retido cobre todo o imposto', () => {
    expect(recolher(mes('2026-06'), reais(0n), vencimento)).toEqual({
      tipo: 'sem-imposto',
    });
  });

  it('o junho da Tabela 11.1: R$ 200,00 menos R$ 10,00 retidos', () => {
    const junho: MovimentoDoMes = {
      mes: mes('2026-06'),
      operacoes: [
        umaCompra({
          data: '2026-06-16',
          quantidade: 1_000,
          precoEmCentavos: 10_00n,
        }),
        umaVenda({
          data: '2026-06-16',
          quantidade: 1_000,
          precoEmCentavos: 11_00n,
        }),
      ],
      retencoes: [
        {
          tipo: 'day-trade',
          data: extrair(criarDataDoCalendario('2026-06-16')),
          valor: reais(10_00n),
        },
      ],
    };

    const { imposto, recolhimento } = extrair(
      apurarMes(inicial, junho, referencias),
    );

    expect(imposto).toEqual(reais(200_00n));
    expect(
      recolhimento.tipo === 'darf' && recolhimento.darf.valor,
    ).toEqual(reais(190_00n));
  });
});

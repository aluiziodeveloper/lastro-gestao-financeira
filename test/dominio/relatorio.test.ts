import { describe, expect, it } from 'vitest';

import type { MovimentoDoMes } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { apurarMeses } from '../../src/dominio/apuracao/apuracao-dos-meses.js';
import { estadoInicial } from '../../src/dominio/apuracao/estado-da-apuracao.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import { relatorioDoMes } from '../../src/dominio/relatorio/relatorio.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes, referenciasCom } from './referencias.js';

const referencias = referenciasCom(
  CatalogoDeAtivos.vazio()
    .com(extrair(Ticker.criar('PETR4')), 'acao')
    .com(extrair(Ticker.criar('HGLG11')), 'fii')
    .com(extrair(Ticker.criar('BOVA11')), 'etf'),
);
const inicial = estadoInicial(
  Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))),
);

// Compra no dia 2 e venda no dia 15 do mesmo mês.
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

function relatorios(movimentos: readonly MovimentoDoMes[]) {
  const { apuracoes } = extrair(
    apurarMeses(movimentos, inicial, referencias),
  );
  return apuracoes.map(relatorioDoMes);
}

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
const abril: MovimentoDoMes = {
  mes: mes('2026-04'),
  operacoes: [compraDeAcoes, compraDeFii, vendaDeAcoes, vendaDeFii],
  retencoes: [],
};

// #region relatorio-teste
describe('Relatório “quanto pagar”', () => {
  it('abril de 2026: R$ 450,00 e o prejuízo de FII guardado', () => {
    const [relatorio] = relatorios([abril]);

    expect(relatorio).toEqual([
      'Apuração de 04/2026',
      'Ações (operação comum): resultado R$ 3.000,00; ' +
        'compensado R$ 0,00; imposto R$ 450,00',
      'FII: resultado -R$ 3.000,00; compensado R$ 0,00; ' +
        'imposto R$ 0,00',
      'Prejuízo a compensar: comum R$ 0,00; day trade R$ 0,00; ' +
        'FII R$ 3.000,00',
      'Imposto do mês: R$ 450,00',
      'IRRF: retido R$ 0,00; deduzido R$ 0,00; saldo R$ 0,00',
      'DARF 6015: R$ 450,00, vencimento 29/05/2026',
    ]);
  });
});
// #endregion

describe('Relatório: o valor abaixo do mínimo e o mês sem vendas', () => {
  const maio: MovimentoDoMes = {
    mes: mes('2026-05'),
    operacoes: compraEVenda('HGLG11', '2026-05', 10, 100_00n, 103_66n),
    retencoes: [],
  };
  const junho: MovimentoDoMes = {
    mes: mes('2026-06'),
    operacoes: compraEVenda('HGLG11', '2026-06', 10, 100_00n, 102_00n),
    retencoes: [],
  };
  const julho = { mes: mes('2026-07'), operacoes: [], retencoes: [] };
  const [doMaio, doJunho, doJulho] = relatorios([maio, junho, julho]);

  it('maio leva os R$ 7,32 ao mês seguinte', () => {
    expect(doMaio?.at(-1)).toBe(
      'Abaixo do mínimo de R$ 10,00: R$ 7,32 passam ao mês seguinte',
    );
  });

  it('junho emite R$ 11,32, a pagar até 31/07/2026', () => {
    expect(doJunho?.at(-1)).toBe(
      'DARF 6015: R$ 11,32, vencimento 31/07/2026',
    );
  });

  it('julho, sem vendas, não lista categoria e nada recolhe', () => {
    expect(doJulho).toEqual([
      'Apuração de 07/2026',
      'Prejuízo a compensar: comum R$ 0,00; day trade R$ 0,00; FII R$ 0,00',
      'Imposto do mês: R$ 0,00',
      'IRRF: retido R$ 0,00; deduzido R$ 0,00; saldo R$ 0,00',
      'Nada a recolher',
    ]);
  });
});

describe('Relatório: venda isenta e IRRF encerrado em dezembro', () => {
  it('mostra a isenção e o saldo que se encerra', () => {
    const dezembro: MovimentoDoMes = {
      mes: mes('2026-12'),
      operacoes: compraEVenda('PETR4', '2026-12', 100, 30_00n, 31_00n),
      retencoes: [
        {
          tipo: 'vendas',
          data: extrair(criarDataDoCalendario('2026-12-15')),
          valor: Dinheiro.deCentavos(1_25n),
        },
      ],
    };

    const [relatorio] = relatorios([dezembro]);

    expect(relatorio).toEqual([
      'Apuração de 12/2026',
      'Ações (operação comum) (isento): resultado R$ 100,00; ' +
        'compensado R$ 0,00; imposto R$ 0,00',
      'Prejuízo a compensar: comum R$ 0,00; day trade R$ 0,00; FII R$ 0,00',
      'Imposto do mês: R$ 0,00',
      'IRRF: retido R$ 1,25; deduzido R$ 0,00; saldo R$ 0,00',
      'IRRF encerrado no fim do ano: R$ 1,25',
      'Nada a recolher',
    ]);
  });
});

describe('Relatório: day trade e ETF', () => {
  it('dá nome a cada categoria com vendas', () => {
    const [compraDeEtf, vendaDeEtf] = compraEVenda(
      'BOVA11',
      '2026-03',
      10,
      120_00n,
      125_00n,
    );
    const marco: MovimentoDoMes = {
      mes: mes('2026-03'),
      operacoes: [
        compraDeEtf,
        umaCompra({
          data: '2026-03-10',
          quantidade: 100,
          precoEmCentavos: 30_00n,
        }),
        umaVenda({
          data: '2026-03-10',
          quantidade: 100,
          precoEmCentavos: 31_00n,
        }),
        vendaDeEtf,
      ],
      retencoes: [],
    };

    const [relatorio] = relatorios([marco]);

    expect(relatorio?.slice(1, 3)).toEqual([
      'Day trade: resultado R$ 100,00; compensado R$ 0,00; ' +
        'imposto R$ 20,00',
      'ETF: resultado R$ 50,00; compensado R$ 0,00; imposto R$ 7,50',
    ]);
  });
});

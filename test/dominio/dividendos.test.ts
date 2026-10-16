import { describe, expect, it } from 'vitest';

import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import {
  criarDataDoCalendario,
  type DataDoCalendario,
} from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  criarEmissor,
  type Emissor,
} from '../../src/dominio/emissor.js';
import { retencaoDeDividendos } from '../../src/dominio/proventos/dividendos.js';
import type {
  Dividendo,
  Provento,
} from '../../src/dominio/proventos/provento.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { mes, referenciasCom } from './referencias.js';

function ticker(codigo: string): Ticker {
  return extrair(Ticker.criar(codigo));
}

function data(texto: string): DataDoCalendario {
  return extrair(criarDataDoCalendario(texto));
}

function emissor(nome: string): Emissor {
  return extrair(criarEmissor(nome));
}

function centavos(valor: bigint): Dinheiro {
  return Dinheiro.deCentavos(valor);
}

const empresas = [
  ['PETR3', 'petrobras'],
  ['PETR4', 'petrobras'],
  ['VALE3', 'vale'],
  ['ITUB4', 'itau'],
] as const;

const catalogo = empresas.reduce(
  (parcial, [codigo, nome]) =>
    extrair(
      parcial
        .com(ticker(codigo), 'acao')
        .comEmissor(ticker(codigo), emissor(nome)),
    ),
  CatalogoDeAtivos.vazio(),
);

const referencias = referenciasCom(catalogo);

interface Pagamento {
  readonly codigo: string;
  readonly bruto: bigint;
  readonly pagamento?: string;
  readonly anoDoLucro?: number;
  readonly aprovacao?: string;
}

function dividendo(pagamento: Pagamento): Dividendo {
  return {
    tipo: 'dividendo',
    ticker: ticker(pagamento.codigo),
    pagamento: data(pagamento.pagamento ?? '2026-03-16'),
    bruto: centavos(pagamento.bruto),
    anoDoLucro: pagamento.anoDoLucro ?? 2026,
    aprovacao: data(pagamento.aprovacao ?? '2026-03-02'),
  };
}

function retidoEmMarco(...pagamentos: Pagamento[]): Dinheiro[] {
  const retencoes = extrair(
    retencaoDeDividendos(
      mes('2026-03'),
      pagamentos.map(dividendo),
      referencias,
    ),
  );
  return retencoes.map(({ retido }) => retido);
}

// #region dividendos-teste
describe('R8 · dividendos por empresa, no mês', () => {
  it.each([
    ['R$ 50.000,00', 'nada', 50_000_00n, 0n],
    ['R$ 50.000,01', 'R$ 5.000,00', 50_000_01n, 5_000_00n],
  ])(
    'a empresa paga %s no mês: retém %s',
    (_pago, _retido, bruto, retido) => {
      expect(retidoEmMarco({ codigo: 'VALE3', bruto })).toEqual([
        centavos(retido),
      ]);
    },
  );

  it('retém 10% do total se a empresa paga mais de R$ 50 mil', () => {
    expect(
      retidoEmMarco(
        { codigo: 'VALE3', bruto: 30_000_00n, pagamento: '2026-03-02' },
        { codigo: 'VALE3', bruto: 30_000_00n, pagamento: '2026-03-30' },
      ),
    ).toEqual([centavos(6_000_00n)]);
  });

  it('soma por empresa, e não por ticker: PETR3 e PETR4', () => {
    expect(
      retidoEmMarco(
        { codigo: 'PETR4', bruto: 30_000_00n },
        { codigo: 'PETR3', bruto: 20_000_01n },
      ),
    ).toEqual([centavos(5_000_00n)]);
  });
});
// #endregion

// #region dividendos-marco
describe('R8 · dividendos de março de 2026, empresa a empresa', () => {
  it('retém só da Petrobras; Vale abaixo, Itaú na transição', () => {
    const marco: Provento[] = [
      { codigo: 'PETR4', bruto: 30_000_00n },
      { codigo: 'PETR3', bruto: 20_000_01n },
      { codigo: 'VALE3', bruto: 45_000_00n },
      {
        codigo: 'ITUB4',
        bruto: 80_000_00n,
        anoDoLucro: 2025,
        aprovacao: '2025-12-15',
      },
    ].map(dividendo);

    expect(
      retencaoDeDividendos(mes('2026-03'), marco, referencias),
    ).toEqual(
      ok([
        {
          emissor: emissor('petrobras'),
          total: centavos(50_000_01n),
          retido: centavos(5_000_00n),
        },
        {
          emissor: emissor('vale'),
          total: centavos(45_000_00n),
          retido: centavos(0n),
        },
      ]),
    );
  });
});
// #endregion

// #region dividendos-transicao-teste
describe('R8 · a transição dos lucros de 2025 (§ 3º)', () => {
  function doItau(anoDoLucro: number, aprovacao: string): Pagamento {
    return {
      codigo: 'ITUB4',
      bruto: 80_000_00n,
      anoDoLucro,
      aprovacao,
    };
  }

  it('lucro e aprovação até 2025: fica fora da soma', () => {
    expect(retidoEmMarco(doItau(2025, '2025-12-31'))).toEqual([]);
  });

  it.each([
    [2025, '2026-01-02'],
    [2026, '2025-12-31'],
  ])('lucro de %i, aprovado em %s: entra na soma', (ano, aprovacao) => {
    expect(retidoEmMarco(doItau(ano, aprovacao))).toEqual([
      centavos(8_000_00n),
    ]);
  });
});
// #endregion

describe('R8 · o que fica fora da soma do mês', () => {
  it('ignora outros meses e outros proventos', () => {
    const proventos: Provento[] = [
      dividendo({
        codigo: 'VALE3',
        bruto: 60_000_00n,
        pagamento: '2026-04-01',
      }),
      {
        tipo: 'jcp',
        ticker: ticker('VALE3'),
        pagamento: data('2026-03-16'),
        bruto: centavos(60_000_00n),
      },
    ];

    expect(
      retencaoDeDividendos(mes('2026-03'), proventos, referencias),
    ).toEqual(ok([]));
  });

  it('não retém nada em 2025: a regra ainda não existia', () => {
    const dezembro = [
      dividendo({
        codigo: 'VALE3',
        bruto: 90_000_00n,
        pagamento: '2025-12-15',
      }),
    ];

    expect(
      retencaoDeDividendos(mes('2025-12'), dezembro, referencias),
    ).toEqual(ok([]));
  });

  it('recusa um mês sem regime', () => {
    expect(
      retencaoDeDividendos(mes('2023-12'), [], referencias),
    ).toEqual(err({ tipo: 'sem-regime-vigente', data: '2023-12-01' }));
  });

  it('recusa um dividendo de empresa desconhecida', () => {
    const semEmissor = referenciasCom(
      CatalogoDeAtivos.vazio().com(ticker('VALE3'), 'acao'),
    );
    const marco = [
      dividendo({ codigo: 'VALE3', bruto: 1_00n }),
      dividendo({ codigo: 'VALE3', bruto: 1_00n }),
    ];

    expect(
      retencaoDeDividendos(mes('2026-03'), marco, semEmissor),
    ).toEqual(
      err({ tipo: 'emissor-desconhecido', ticker: ticker('VALE3') }),
    );
  });
});

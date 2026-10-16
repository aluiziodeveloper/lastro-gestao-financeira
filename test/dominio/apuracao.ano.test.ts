import { describe, expect, it } from 'vitest';

import type { MovimentoDoMes } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { apurarMeses } from '../../src/dominio/apuracao/apuracao-dos-meses.js';
import { estadoInicial } from '../../src/dominio/apuracao/estado-da-apuracao.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import type { ImpostoRetido } from '../../src/dominio/irrf/imposto-retido.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes, referenciasCom } from './referencias.js';

const referencias = referenciasCom(
  ['ITUB4', 'VALE3', 'PETR4'].reduce(
    (catalogo, codigo) =>
      catalogo.com(extrair(Ticker.criar(codigo)), 'acao'),
    CatalogoDeAtivos.vazio()
      .com(extrair(Ticker.criar('BOVA11')), 'etf')
      .com(extrair(Ticker.criar('HGLG11')), 'fii'),
  ),
);

// Compra e venda de um ativo no mês, em dias diferentes.
function negocio(
  ticker: string,
  compra: string,
  venda: string,
  quantidade: number,
  precos: readonly [bigint, bigint],
): readonly [Operacao, Operacao] {
  const [precoDeCompra, precoDeVenda] = precos;
  return [
    umaCompra({
      ticker,
      data: compra,
      quantidade,
      precoEmCentavos: precoDeCompra,
    }),
    umaVenda({
      ticker,
      data: venda,
      quantidade,
      precoEmCentavos: precoDeVenda,
    }),
  ];
}

function movimento(
  texto: string,
  operacoes: readonly Operacao[],
  retencoes: readonly ImpostoRetido[] = [],
): MovimentoDoMes {
  return { mes: mes(texto), operacoes, retencoes };
}

const [compraEmMarco, vendaEmMarco] = negocio(
  'PETR4',
  '2026-03-02',
  '2026-03-16',
  1_000,
  [25_00n, 28_00n],
);
const [compraDeEtf, vendaDeEtf] = negocio(
  'BOVA11',
  '2026-03-02',
  '2026-03-16',
  100,
  [120_00n, 125_00n],
);
const [compraEmAbril, vendaEmAbril] = negocio(
  'PETR4',
  '2026-04-02',
  '2026-04-15',
  1_000,
  [22_00n, 25_00n],
);
const [compraDeFii, vendaDeFii] = negocio(
  'HGLG11',
  '2026-04-02',
  '2026-04-15',
  100,
  [160_00n, 130_00n],
);

// O semestre da Tabela 11.1, um movimento por mês.
const semestre: readonly MovimentoDoMes[] = [
  movimento(
    '2026-01',
    negocio('ITUB4', '2026-01-05', '2026-01-20', 2_000, [
      15_00n,
      14_00n,
    ]),
  ),
  movimento(
    '2026-02',
    negocio('VALE3', '2026-02-02', '2026-02-20', 100, [60_00n, 70_00n]),
  ),
  movimento('2026-03', [
    compraEmMarco,
    compraDeEtf,
    vendaEmMarco,
    vendaDeEtf,
  ]),
  movimento('2026-04', [
    compraEmAbril,
    compraDeFii,
    vendaEmAbril,
    vendaDeFii,
  ]),
  movimento(
    '2026-05',
    negocio('HGLG11', '2026-05-04', '2026-05-15', 100, [
      100_00n,
      110_00n,
    ]),
  ),
  movimento(
    '2026-06',
    negocio('PETR4', '2026-06-16', '2026-06-16', 1_000, [
      10_00n,
      11_00n,
    ]),
    [
      {
        tipo: 'day-trade',
        data: extrair(criarDataDoCalendario('2026-06-16')),
        valor: Dinheiro.deCentavos(10_00n),
      },
    ],
  ),
];

// #region casos-do-ano
// Cada linha foi resolvida à mão: o imposto do mês, o prejuízo que
// sobra nos grupos comum e FII, o DARF e o vencimento. Sem DARF, o
// valor é zero e o vencimento fica vazio.
// prettier-ignore
const tabela = [
  // mês        imposto      comum        FII       DARF  vencimento
  ['2026-01',       0n, 2_000_00n,        0n,       0n, ''],
  ['2026-02',       0n, 2_000_00n,        0n,       0n, ''],
  ['2026-03',  225_00n,        0n,        0n,  225_00n, '2026-04-30'],
  ['2026-04',  450_00n,        0n, 3_000_00n,  450_00n, '2026-05-29'],
  ['2026-05',       0n,        0n, 2_000_00n,       0n, ''],
  ['2026-06',  200_00n,        0n, 2_000_00n,  190_00n, '2026-07-31'],
] as const;

describe('Um semestre de 2026, resolvido à mão (Tabela 11.1)', () => {
  const { apuracoes } = extrair(
    apurarMeses(semestre, estadoInicial(carteiraVazia()), referencias),
  );

  it.each(tabela)('%s', (texto, imposto, comum, fii, darf, prazo) => {
    const apuracao = apuracoes.find((apurada) =>
      apurada.mes.equivaleA(mes(texto)),
    );
    const { recolhimento, estado } = apuracao ?? {};
    const pago =
      recolhimento?.tipo === 'darf' ? recolhimento.darf : null;

    expect(apuracao?.imposto).toEqual(reais(imposto));
    expect(estado?.prejuizo.saldoDe('comum')).toEqual(reais(comum));
    expect(estado?.prejuizo.saldoDe('fii')).toEqual(reais(fii));
    expect(pago?.valor ?? reais(0n)).toEqual(reais(darf));
    expect(pago?.vencimento ?? '').toBe(prazo);
  });
});
// #endregion

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

function carteiraVazia(): Carteira {
  return Carteira.abrir(extrair(criarIdDeCarteira('carteira-1')));
}

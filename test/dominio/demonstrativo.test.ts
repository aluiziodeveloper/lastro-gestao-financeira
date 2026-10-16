import { describe, expect, it } from 'vitest';

import type { MovimentoDoMes } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { apurarMeses } from '../../src/dominio/apuracao/apuracao-dos-meses.js';
import { demonstrativoDoAno } from '../../src/dominio/apuracao/demonstrativo.js';
import { estadoInicial } from '../../src/dominio/apuracao/estado-da-apuracao.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import { PrejuizoAcumulado } from '../../src/dominio/prejuizo/prejuizo-acumulado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes, referenciasCom } from './referencias.js';

const referencias = referenciasCom(
  CatalogoDeAtivos.vazio()
    .com(extrair(Ticker.criar('PETR4')), 'acao')
    .com(extrair(Ticker.criar('HGLG11')), 'fii'),
);

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

// Compra no dia 2 e venda no dia 15 do mês.
function negocio(
  ticker: string,
  texto: string,
  quantidade: number,
  compra: bigint,
  venda: bigint,
): readonly Operacao[] {
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

function movimento(
  texto: string,
  operacoes: readonly Operacao[],
): MovimentoDoMes {
  return { mes: mes(texto), operacoes, retencoes: [] };
}

// Janeiro: R$ 2.000,00 de prejuízo em ações. Fevereiro: nada.
// Março: R$ 3.000,00 de lucro em ações. Abril: R$ 3.000,00 de
// prejuízo em FII. Do ano anterior vêm R$ 500,00 de day trade.
const quatroMeses = [
  movimento(
    '2026-01',
    negocio('PETR4', '2026-01', 2_000, 15_00n, 14_00n),
  ),
  movimento('2026-02', []),
  movimento(
    '2026-03',
    negocio('PETR4', '2026-03', 1_000, 25_00n, 28_00n),
  ),
  movimento(
    '2026-04',
    negocio('HGLG11', '2026-04', 100, 160_00n, 130_00n),
  ),
];
const doAnoAnterior = PrejuizoAcumulado.nenhum().acumular(
  'day-trade',
  reais(-500_00n),
);

function demonstrativo() {
  const inicial = {
    ...estadoInicial(
      Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))),
    ),
    prejuizo: doAnoAnterior,
  };
  const { apuracoes } = extrair(
    apurarMeses(quatroMeses, inicial, referencias),
  );
  return demonstrativoDoAno(apuracoes, doAnoAnterior);
}

function colunas(
  resultado: bigint,
  anterior: bigint,
  base: bigint,
  aCompensar: bigint,
) {
  return {
    resultado: reais(resultado),
    anterior: reais(anterior),
    base: reais(base),
    aCompensar: reais(aCompensar),
  };
}

describe('Desafio · o demonstrativo do ano (pergunta 711)', () => {
  it('uma linha por mês, na ordem', () => {
    expect(demonstrativo().map((linha) => linha.mes)).toEqual([
      mes('2026-01'),
      mes('2026-02'),
      mes('2026-03'),
      mes('2026-04'),
    ]);
  });

  it('o grupo comum: o prejuízo de janeiro vai até março', () => {
    expect(demonstrativo().map((linha) => linha.grupos.comum)).toEqual([
      colunas(-2_000_00n, 0n, 0n, 2_000_00n),
      colunas(0n, 2_000_00n, 0n, 2_000_00n),
      colunas(3_000_00n, 2_000_00n, 1_000_00n, 0n),
      colunas(0n, 0n, 0n, 0n),
    ]);
  });

  it('o FII: o prejuízo de abril fica a compensar', () => {
    const [, , , abril] = demonstrativo();

    expect(abril?.grupos.fii).toEqual(
      colunas(-3_000_00n, 0n, 0n, 3_000_00n),
    );
  });

  it('o day trade carrega o prejuízo do ano anterior', () => {
    expect(
      demonstrativo().map((linha) => linha.grupos['day-trade']),
    ).toEqual(
      Array.from({ length: 4 }, () =>
        colunas(0n, 500_00n, 0n, 500_00n),
      ),
    );
  });

  it('sem apurações, o demonstrativo é vazio', () => {
    expect(demonstrativoDoAno([], doAnoAnterior)).toEqual([]);
  });
});

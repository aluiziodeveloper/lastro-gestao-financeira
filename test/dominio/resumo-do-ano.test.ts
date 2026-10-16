import { describe, expect, it } from 'vitest';

import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarEmissor } from '../../src/dominio/emissor.js';
import type { Provento } from '../../src/dominio/proventos/provento.js';
import {
  resumoDoAno,
  type TotaisDoAno,
} from '../../src/dominio/proventos/resumo-do-ano.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { referenciasCom } from './referencias.js';

function ticker(codigo: string): Ticker {
  return extrair(Ticker.criar(codigo));
}

function data(texto: string) {
  return extrair(criarDataDoCalendario(texto));
}

function centavos(valor: bigint): Dinheiro {
  return Dinheiro.deCentavos(valor);
}

function totais(bruto: bigint, retido: bigint): TotaisDoAno {
  return {
    bruto: centavos(bruto),
    retido: centavos(retido),
    liquido: centavos(bruto - retido),
  };
}

const acoes = [
  ['PETR3', 'petrobras'],
  ['PETR4', 'petrobras'],
  ['VALE3', 'vale'],
  ['ITUB4', 'itau'],
] as const;

const comAcoes = acoes.reduce(
  (parcial, [codigo, nome]) =>
    extrair(
      parcial
        .com(ticker(codigo), 'acao')
        .comEmissor(ticker(codigo), extrair(criarEmissor(nome))),
    ),
  CatalogoDeAtivos.vazio().com(ticker('HGLG11'), 'fii'),
);

// Um fundo que cumpre os requisitos da isenção desde 2024.
const catalogo = extrair(
  comAcoes.comSituacaoDoFundo(ticker('HGLG11'), {
    desde: data('2024-01-01'),
    negociacao: 'bolsa-ou-balcao-organizado',
    cotistas: 500,
    cotasEmitidas: extrair(Quantidade.criar(1_000_000)),
  }),
);

const referencias = referenciasCom(catalogo);

function dividendo(
  codigo: string,
  pagamento: string,
  bruto: bigint,
  anoDoLucro = 2026,
): Provento {
  return {
    tipo: 'dividendo',
    ticker: ticker(codigo),
    pagamento: data(pagamento),
    bruto: centavos(bruto),
    anoDoLucro,
    aprovacao: data(`${String(anoDoLucro)}-01-02`),
  };
}

function jcp(pagamento: string, bruto: bigint): Provento {
  return {
    tipo: 'jcp',
    ticker: ticker('ITUB4'),
    pagamento: data(pagamento),
    bruto: centavos(bruto),
  };
}

const rendimentoDoFii: Provento = {
  tipo: 'rendimento-de-fii',
  ticker: ticker('HGLG11'),
  pagamento: data('2026-05-15'),
  bruto: centavos(850_00n),
  cotas: extrair(Quantidade.criar(100)),
};

// #region resumo-do-ano-teste
describe('desafio · resumo anual dos proventos', () => {
  it('zera os três tratamentos num ano sem proventos', () => {
    expect(resumoDoAno([], 2026, referencias)).toEqual(
      ok({
        isento: totais(0n, 0n),
        'exclusivo-na-fonte': totais(0n, 0n),
        'retido-por-antecipacao': totais(0n, 0n),
      }),
    );
  });

  it('separa os três tratamentos de 2026', () => {
    const proventos = [
      dividendo('PETR4', '2026-03-10', 30_000_00n),
      dividendo('PETR3', '2026-03-20', 20_000_01n),
      dividendo('VALE3', '2026-03-16', 45_000_00n),
      jcp('2026-06-30', 1_000_00n),
      rendimentoDoFii,
    ];

    expect(resumoDoAno(proventos, 2026, referencias)).toEqual(
      ok({
        isento: totais(45_850_00n, 0n),
        'exclusivo-na-fonte': totais(1_000_00n, 175_00n),
        'retido-por-antecipacao': totais(50_000_01n, 5_000_00n),
      }),
    );
  });

  it('põe o JCP de dez/2025 em 2025 e o de jan/2026 em 2026', () => {
    const proventos = [
      jcp('2025-12-30', 1_234_56n),
      jcp('2026-01-02', 1_234_56n),
    ];
    const exclusivo = (ano: number) =>
      extrair(resumoDoAno(proventos, ano, referencias))[
        'exclusivo-na-fonte'
      ];

    expect([exclusivo(2025), exclusivo(2026)]).toEqual([
      totais(1_234_56n, 185_18n),
      totais(1_234_56n, 216_05n),
    ]);
  });

  it('conta como isento o dividendo da transição (§ 3º)', () => {
    const doItau = dividendo('ITUB4', '2026-03-16', 80_000_00n, 2025);
    const doItauAprovadoEm2025 = {
      ...doItau,
      aprovacao: data('2025-12-15'),
    };

    expect(
      resumoDoAno([doItauAprovadoEm2025], 2026, referencias),
    ).toEqual(
      ok({
        isento: totais(80_000_00n, 0n),
        'exclusivo-na-fonte': totais(0n, 0n),
        'retido-por-antecipacao': totais(0n, 0n),
      }),
    );
  });

  it('recusa o dividendo de empresa sem emissor', () => {
    const semEmissor = referenciasCom(
      catalogo.com(ticker('BBAS3'), 'acao'),
    );
    const proventos = [
      dividendo('BBAS3', '2026-03-16', 1_00n),
      dividendo('BBAS3', '2026-04-16', 1_00n),
    ];

    expect(resumoDoAno(proventos, 2026, semEmissor)).toEqual(
      err({ tipo: 'emissor-desconhecido', ticker: ticker('BBAS3') }),
    );
  });

  it('recusa um ano sem regime', () => {
    expect(
      resumoDoAno(
        [jcp('2023-06-30', 1_00n), jcp('2023-12-30', 1_00n)],
        2023,
        referencias,
      ),
    ).toEqual(err({ tipo: 'sem-regime-vigente', data: '2023-06-30' }));
  });
});
// #endregion

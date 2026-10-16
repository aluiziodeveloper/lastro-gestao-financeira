import { describe, expect, it } from 'vitest';

import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import {
  criarDataDoCalendario,
  type DataDoCalendario,
} from '../../src/dominio/data-do-calendario.js';
import { criarEmissor } from '../../src/dominio/emissor.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import type { SituacaoDoFundo } from '../../src/dominio/situacao-do-fundo.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';

function ticker(codigo: string): Ticker {
  return extrair(Ticker.criar(codigo));
}

// #region catalogo-de-ativos-teste
describe('Catálogo de ativos', () => {
  const catalogo = CatalogoDeAtivos.vazio()
    .com(ticker('PETR4'), 'acao')
    .com(ticker('HGLG11'), 'fii')
    .com(ticker('BOVA11'), 'etf')
    .com(ticker('TAEE11'), 'acao');

  it.each([
    ['PETR4', 'acao'],
    ['HGLG11', 'fii'],
    ['BOVA11', 'etf'],
    ['TAEE11', 'acao'],
  ] as const)('classifica %s como %s', (codigo, classe) => {
    expect(catalogo.classeDe(ticker(codigo))).toEqual(ok(classe));
  });

  it('recusa um ativo que não está no catálogo', () => {
    expect(catalogo.classeDe(ticker('VALE3'))).toEqual(
      err({ tipo: 'ativo-fora-do-catalogo', ticker: ticker('VALE3') }),
    );
  });

  it('acha o ativo pelo código normalizado', () => {
    expect(catalogo.classeDe(ticker(' hglg11 '))).toEqual(ok('fii'));
  });

  it('não muda o catálogo que recebeu a inclusão', () => {
    const vazio = CatalogoDeAtivos.vazio();
    vazio.com(ticker('PETR4'), 'acao');
    expect(vazio.classeDe(ticker('PETR4')).ok).toBe(false);
  });
});
// #endregion

function data(texto: string): DataDoCalendario {
  return extrair(criarDataDoCalendario(texto));
}

function situacao(desde: string, cotistas: number): SituacaoDoFundo {
  return {
    desde: data(desde),
    negociacao: 'bolsa-ou-balcao-organizado',
    cotistas,
    cotasEmitidas: extrair(Quantidade.criar(1_000_000)),
  };
}

// #region situacao-do-fundo-teste
describe('Catálogo de ativos: a situação do fundo no tempo', () => {
  const hglg11 = ticker('HGLG11');
  const comFii = CatalogoDeAtivos.vazio().com(hglg11, 'fii');
  const deJaneiro = situacao('2026-01-01', 80);
  const deMarco = situacao('2026-03-10', 120);
  // Incluídas fora de ordem: o catálogo as ordena pela data.
  const catalogo = extrair(
    extrair(
      comFii.comSituacaoDoFundo(hglg11, deMarco),
    ).comSituacaoDoFundo(hglg11, deJaneiro),
  );

  it.each([
    ['2026-01-01', deJaneiro],
    ['2026-03-09', deJaneiro],
    ['2026-03-10', deMarco],
    ['2026-12-31', deMarco],
  ])(
    'em %s vale a situação mais recente já começada',
    (texto, esperada) => {
      expect(catalogo.situacaoDoFundoEm(hglg11, data(texto))).toEqual(
        ok(esperada),
      );
    },
  );

  it('não conhece a situação antes da primeira', () => {
    expect(
      catalogo.situacaoDoFundoEm(hglg11, data('2025-12-31')),
    ).toEqual(
      err({
        tipo: 'situacao-do-fundo-desconhecida',
        ticker: hglg11,
        data: '2025-12-31',
      }),
    );
  });
});
// #endregion

describe('Catálogo de ativos: inclusão das situações', () => {
  const hglg11 = ticker('HGLG11');
  const comFii = CatalogoDeAtivos.vazio().com(hglg11, 'fii');

  function incluir(...situacoes: SituacaoDoFundo[]): CatalogoDeAtivos {
    return situacoes.reduce(
      (catalogo, situacao) =>
        extrair(catalogo.comSituacaoDoFundo(hglg11, situacao)),
      comFii,
    );
  }

  it('ordena três situações incluídas fora de ordem', () => {
    const [jan, fev, mar] = ['2026-01-01', '2026-02-01', '2026-03-01'];
    const catalogo = incluir(
      situacao(mar, 3),
      situacao(jan, 1),
      situacao(fev, 2),
    );
    const cotistasEm = (texto: string) =>
      extrair(catalogo.situacaoDoFundoEm(hglg11, data(texto))).cotistas;

    expect(
      ['2026-01-15', '2026-02-15', '2026-03-15'].map(cotistasEm),
    ).toEqual([1, 2, 3]);
  });

  it.each([
    [80, 120],
    [120, 80],
  ])(
    'troca %i cotistas por %i na mesma data: é correção',
    (antes, depois) => {
      const catalogo = incluir(
        situacao('2026-01-01', antes),
        situacao('2026-01-01', depois),
      );

      expect(
        catalogo.situacaoDoFundoEm(hglg11, data('2026-06-30')),
      ).toEqual(ok(situacao('2026-01-01', depois)));
    },
  );
});

describe('Catálogo de ativos: situação de um ativo ausente', () => {
  const xplg11 = ticker('XPLG11');
  const vazio = CatalogoDeAtivos.vazio();
  const fora = err({ tipo: 'ativo-fora-do-catalogo', ticker: xplg11 });

  it('recusa incluir a situação de um ativo fora do catálogo', () => {
    expect(
      vazio.comSituacaoDoFundo(xplg11, situacao('2026-01-01', 100)),
    ).toEqual(fora);
  });

  it('recusa consultar a situação de um ativo fora do catálogo', () => {
    expect(vazio.situacaoDoFundoEm(xplg11, data('2026-01-01'))).toEqual(
      fora,
    );
  });

  it('guarda a classe do ativo ao incluir a situação', () => {
    const comFii = CatalogoDeAtivos.vazio().com(xplg11, 'fii');
    const comSituacao = extrair(
      comFii.comSituacaoDoFundo(xplg11, situacao('2026-01-01', 100)),
    );

    expect(comSituacao.classeDe(xplg11)).toEqual(ok('fii'));
  });
});

// #region emissor-no-catalogo-teste
describe('Catálogo de ativos: o emissor de cada ação', () => {
  const petrobras = extrair(criarEmissor('petrobras'));
  const [petr3, petr4] = [ticker('PETR3'), ticker('PETR4')];
  const catalogo = [petr3, petr4].reduce(
    (parcial, codigo) =>
      extrair(
        parcial.com(codigo, 'acao').comEmissor(codigo, petrobras),
      ),
    CatalogoDeAtivos.vazio(),
  );

  it('dois tickers, a mesma empresa', () => {
    expect([
      catalogo.emissorDe(petr3),
      catalogo.emissorDe(petr4),
    ]).toEqual([ok(petrobras), ok(petrobras)]);
  });

  it('não conhece o emissor de um ativo sem ele', () => {
    const vale3 = ticker('VALE3');
    const semEmissor = catalogo.com(vale3, 'acao');

    expect(semEmissor.emissorDe(vale3)).toEqual(
      err({ tipo: 'emissor-desconhecido', ticker: vale3 }),
    );
  });

  it('recusa o emissor de um ativo fora do catálogo', () => {
    const fora = err({
      tipo: 'ativo-fora-do-catalogo',
      ticker: ticker('VALE3'),
    });

    expect(catalogo.comEmissor(ticker('VALE3'), petrobras)).toEqual(
      fora,
    );
    expect(catalogo.emissorDe(ticker('VALE3'))).toEqual(fora);
  });

  it('guarda a classe ao incluir o emissor', () => {
    expect(catalogo.classeDe(petr4)).toEqual(ok('acao'));
  });
});
// #endregion

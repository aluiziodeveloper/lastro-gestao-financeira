import { describe, expect, it } from 'vitest';

import { Aliquota } from '../../src/dominio/aliquota.js';
import {
  criarDataDoCalendario,
  type DataDoCalendario,
} from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import type { DefinicaoDeRegime } from '../../src/dominio/regime/regime-tributario.js';
import { definicoesDoLastro } from '../../src/dominio/regime/regimes.js';
import { RegimesTributarios } from '../../src/dominio/regime/regimes-tributarios.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';

function data(texto: string): DataDoCalendario {
  return extrair(criarDataDoCalendario(texto));
}

const regimes = extrair(RegimesTributarios.criar(definicoesDoLastro));

function nomeDoRegimeEm(texto: string): string {
  return extrair(regimes.vigenteEm(data(texto))).nome;
}

// #region regimes-virada
describe('RegimesTributarios: o regime de cada data', () => {
  it.each([
    ['2024-01-01', '2024-2025'],
    ['2025-12-31', '2024-2025'],
    ['2026-01-01', '2026'],
    ['2099-12-31', '2026'],
  ])('%s cai no regime %s', (texto, nome) => {
    expect(nomeDoRegimeEm(texto)).toBe(nome);
  });

  it('não tem regime antes de 2024', () => {
    expect(regimes.vigenteEm(data('2023-12-31'))).toEqual(
      err({ tipo: 'sem-regime-vigente', data: '2023-12-31' }),
    );
  });
});
// #endregion

describe('RegimesTributarios: os valores de 2026', () => {
  const { apuracao } = extrair(regimes.vigenteEm(data('2026-03-16')));

  it('ações a 15%, isentas até R$ 20.000,00 vendidos no mês', () => {
    expect(apuracao['acoes-comum']).toEqual({
      aliquota: Aliquota.de(15n, 100n),
      isencaoAte: Dinheiro.deCentavos(20_000_00n),
    });
  });

  it('day trade e FII a 20%, ETF a 15%, sem isenção', () => {
    expect([apuracao['day-trade'], apuracao.fii, apuracao.etf]).toEqual(
      [
        { aliquota: Aliquota.de(20n, 100n) },
        { aliquota: Aliquota.de(20n, 100n) },
        { aliquota: Aliquota.de(15n, 100n) },
      ],
    );
  });
});

function definicao(
  nome: string,
  inicio: string,
  fim?: string,
): DefinicaoDeRegime {
  const [{ apuracao, proventos }] = definicoesDoLastro as [
    DefinicaoDeRegime,
  ];
  return fim === undefined
    ? { nome, inicio, apuracao, proventos }
    : { nome, inicio, fim, apuracao, proventos };
}

const ate2026 = definicao('antigo', '2024-01-01', '2026-01-01');

// #region regimes-validacao
describe('RegimesTributarios: o conjunto cobre o tempo uma vez só', () => {
  it('recusa uma lacuna: o seguinte começa depois do fim', () => {
    const novo = definicao('novo', '2026-02-01');

    expect(RegimesTributarios.criar([ate2026, novo])).toEqual(
      err({
        tipo: 'lacuna-entre-regimes',
        anterior: 'antigo',
        seguinte: 'novo',
      }),
    );
  });

  it('recusa sobreposição: o seguinte começa antes do fim', () => {
    const novo = definicao('novo', '2025-12-01');

    expect(RegimesTributarios.criar([ate2026, novo])).toEqual(
      err({
        tipo: 'regimes-sobrepostos',
        anterior: 'antigo',
        seguinte: 'novo',
      }),
    );
  });

  it('recusa um regime depois de outro que não tem fim', () => {
    const semFim = definicao('sem-fim', '2024-01-01');
    const novo = definicao('novo', '2026-01-01');

    expect(RegimesTributarios.criar([semFim, novo])).toEqual(
      err({
        tipo: 'regimes-sobrepostos',
        anterior: 'sem-fim',
        seguinte: 'novo',
      }),
    );
  });

  it('recusa um regime que não começa no dia 1', () => {
    const novo = definicao('meio-do-mes', '2026-01-15');

    expect(RegimesTributarios.criar([novo])).toEqual(
      err({ tipo: 'inicio-fora-do-dia-1', regime: 'meio-do-mes' }),
    );
  });
});
// #endregion

describe('RegimesTributarios: construção', () => {
  it('ordena pelo início, qualquer que seja a declaração', () => {
    const novo = definicao('novo', '2026-01-01');
    const invertidos = extrair(
      RegimesTributarios.criar([novo, ate2026]),
    );

    expect(extrair(invertidos.vigenteEm(data('2025-06-02'))).nome).toBe(
      'antigo',
    );
  });

  it('aponta a primeira falha da sequência, e não a última', () => {
    const meio = definicao('meio', '2026-02-01', '2027-01-01');
    const fim = definicao('fim', '2026-06-01');

    expect(RegimesTributarios.criar([ate2026, meio, fim])).toEqual(
      err({
        tipo: 'lacuna-entre-regimes',
        anterior: 'antigo',
        seguinte: 'meio',
      }),
    );
  });

  it('devolve o erro da primeira definição que falha', () => {
    const invalida = definicao('x', '2026-02-30');

    expect(RegimesTributarios.criar([invalida, ate2026])).toEqual(
      err({ tipo: 'data-inexistente', texto: '2026-02-30' }),
    );
  });

  it('recusa uma data que não existe', () => {
    expect(
      RegimesTributarios.criar([ate2026, definicao('x', '2026-02-30')]),
    ).toEqual(err({ tipo: 'data-inexistente', texto: '2026-02-30' }));
  });

  it('recusa um fim fora do formato', () => {
    expect(
      RegimesTributarios.criar([definicao('x', '2026-01-01', '2027')]),
    ).toEqual(err({ tipo: 'data-fora-do-formato', texto: '2027' }));
  });

  it('recusa um regime que termina onde começa', () => {
    expect(
      RegimesTributarios.criar([
        definicao('vazio', '2026-01-01', '2026-01-01'),
      ]),
    ).toEqual(
      err({
        tipo: 'vigencia-vazia',
        inicio: '2026-01-01',
        fim: '2026-01-01',
      }),
    );
  });

  it('sem regimes, nenhuma data tem regime', () => {
    const nenhum = extrair(RegimesTributarios.criar([]));

    expect(nenhum.vigenteEm(data('2026-01-01')).ok).toBe(false);
  });
});

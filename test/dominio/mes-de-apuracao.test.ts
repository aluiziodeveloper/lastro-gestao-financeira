import { describe, expect, it } from 'vitest';

import { MesDeApuracao } from '../../src/dominio/apuracao/mes-de-apuracao.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';
import { mes } from './referencias.js';

describe('MesDeApuracao', () => {
  it.each([
    ['2026-03', '2026-03-01'],
    ['2024-01', '2024-01-01'],
    ['2025-12', '2025-12-01'],
  ])('a lei de %s é a de %s', (texto, primeiroDia) => {
    expect(mes(texto).primeiroDia()).toBe(primeiroDia);
  });

  it.each([
    ['03/2026', 'no formato brasileiro'],
    ['2026-3', 'sem zero à esquerda'],
    ['2026-03-01', 'com o dia'],
    [' 2026-03', 'com espaço antes'],
    ['', 'vazio'],
  ])('recusa %s, %s', (texto) => {
    expect(MesDeApuracao.criar(texto)).toEqual(
      err({ tipo: 'mes-fora-do-formato', texto }),
    );
  });

  it.each(['2026-13', '2026-00'])(
    'recusa %s, que não existe',
    (texto) => {
      expect(MesDeApuracao.criar(texto)).toEqual(
        err({ tipo: 'mes-inexistente', texto }),
      );
    },
  );

  it('compara por valor e mostra o mês na mensagem de falha', () => {
    expect(mes('2026-03')).toEqual(mes('2026-03'));
    expect(() => {
      expect(mes('2026-03')).toEqual(mes('2026-04'));
    }).toThrow(
      'expected MesDeApuracao(2026-03) to deeply equal ' +
        'MesDeApuracao(2026-04)',
    );
  });

  it.each([
    ['2026-03-01', true],
    ['2026-03-31', true],
    ['2026-02-28', false],
    ['2026-04-01', false],
    ['2025-03-15', false],
  ])('março de 2026 contém %s: %s', (texto, esperado) => {
    const data = extrair(criarDataDoCalendario(texto));

    expect(mes('2026-03').contem(data)).toBe(esperado);
  });
});

// #region mes-seguinte-teste
describe('MesDeApuracao: o mês seguinte', () => {
  it.each([
    ['2026-02', '2026-01', true, 'fevereiro depois de janeiro'],
    ['2027-01', '2026-12', true, 'janeiro depois de dezembro'],
    ['2026-01', '2026-01', false, 'o mesmo mês'],
    ['2026-03', '2026-01', false, 'depois de uma lacuna'],
    ['2026-01', '2026-02', false, 'antes do anterior'],
    ['2027-12', '2026-12', false, 'o mesmo mês de outro ano'],
  ])('%s segue %s: %s (%s)', (texto, anterior, esperado) => {
    expect(mes(texto).ehSeguinteDe(mes(anterior))).toBe(esperado);
  });
});
// #endregion

describe('MesDeApuracao: dezembro', () => {
  it.each([
    ['2026-12', true],
    ['2026-11', false],
    ['2027-01', false],
  ])('%s é dezembro: %s', (texto, esperado) => {
    expect(mes(texto).ehDezembro()).toBe(esperado);
  });
});

describe('MesDeApuracao: os dias do mês', () => {
  it.each([
    ['2026-02', 28, '2026-02-28'],
    ['2024-02', 29, '2024-02-29'],
    ['2026-04', 30, '2026-04-30'],
    ['2026-03', 31, '2026-03-31'],
  ])('%s tem %s dias, até %s', (texto, quantos, ultimo) => {
    const dias = mes(texto).dias();

    expect(dias.length).toBe(quantos);
    expect(dias[0]).toBe(`${texto}-01`);
    expect(dias[quantos - 1]).toBe(ultimo);
  });
});

describe('MesDeApuracao: o mês seguinte, como valor', () => {
  it.each([
    ['2026-01', '2026-02'],
    ['2026-11', '2026-12'],
    ['2026-12', '2027-01'],
  ])('depois de %s vem %s', (texto, seguinte) => {
    expect(mes(texto).seguinte()).toEqual(mes(seguinte));
  });
});

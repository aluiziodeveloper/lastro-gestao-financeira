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

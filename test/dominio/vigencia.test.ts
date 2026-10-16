import { describe, expect, it } from 'vitest';

import {
  criarDataDoCalendario,
  type DataDoCalendario,
} from '../../src/dominio/data-do-calendario.js';
import { err } from '../../src/dominio/resultado.js';
import { Vigencia } from '../../src/dominio/vigencia.js';
import { extrair } from '../apoio/resultado.js';

function data(texto: string): DataDoCalendario {
  return extrair(criarDataDoCalendario(texto));
}

function entre(inicio: string, fim: string): Vigencia {
  return extrair(Vigencia.entre(data(inicio), data(fim)));
}

// #region vigencia-teste
describe('Vigencia: intervalo semiaberto [início, fim)', () => {
  const doisAnos = entre('2024-01-01', '2026-01-01');

  it.each([
    ['2024-01-01', true, 'o início entra'],
    ['2025-12-31', true, 'a véspera do fim entra'],
    ['2026-01-01', false, 'o fim não entra'],
    ['2023-12-31', false, 'a véspera do início fica fora'],
  ])('%s: %s (%s)', (texto, esperado) => {
    expect(doisAnos.contem(data(texto))).toBe(esperado);
  });

  it('sem fim, vale do início em diante', () => {
    const desde2026 = Vigencia.desde(data('2026-01-01'));

    expect(desde2026.contem(data('2025-12-31'))).toBe(false);
    expect(desde2026.contem(data('2026-01-01'))).toBe(true);
    expect(desde2026.contem(data('2099-12-31'))).toBe(true);
  });

  it('vizinhas dividem a data: ela pertence só à segunda', () => {
    const virada = data('2026-01-01');
    const depois = Vigencia.desde(virada);

    expect([doisAnos.contem(virada), depois.contem(virada)]).toEqual([
      false,
      true,
    ]);
  });
});
// #endregion

describe('Vigencia: construção', () => {
  it.each([
    ['2026-01-01', '2026-01-01', 'fim igual ao início'],
    ['2026-01-01', '2025-12-31', 'fim antes do início'],
  ])('recusa %s a %s, %s', (inicio, fim) => {
    expect(Vigencia.entre(data(inicio), data(fim))).toEqual(
      err({ tipo: 'vigencia-vazia', inicio, fim }),
    );
  });

  it('aceita um dia só: [2026-01-01, 2026-01-02)', () => {
    const umDia = entre('2026-01-01', '2026-01-02');

    expect(umDia.contem(data('2026-01-01'))).toBe(true);
    expect(umDia.contem(data('2026-01-02'))).toBe(false);
  });

  it('compara por valor, com e sem fim', () => {
    expect(entre('2024-01-01', '2026-01-01')).toEqual(
      entre('2024-01-01', '2026-01-01'),
    );
    expect(Vigencia.desde(data('2026-01-01'))).not.toEqual(
      entre('2026-01-01', '2027-01-01'),
    );
    expect(entre('2025-01-01', '2026-01-01')).not.toEqual(
      entre('2024-01-01', '2026-01-01'),
    );
  });

  it('mostra o intervalo na mensagem de falha', () => {
    expect(() => {
      expect(entre('2024-01-01', '2026-01-01')).toEqual(
        Vigencia.desde(data('2026-01-01')),
      );
    }).toThrow(
      'expected Vigencia[2024-01-01, 2026-01-01) to deeply equal ' +
        'Vigencia[2026-01-01, …)',
    );
  });
});

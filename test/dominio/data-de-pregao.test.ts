import { describe, expect, it } from 'vitest';

import { criarDataDePregao } from '../../src/dominio/data-de-pregao.js';
import { err, ok } from '../../src/dominio/resultado.js';

describe('DataDePregao', () => {
  it.each(['2026-03-16', '2024-02-29', '2000-02-29', '2026-12-31'])(
    'aceita %s, que existe no calendário',
    (texto) => {
      expect(criarDataDePregao(texto)).toEqual(ok(texto));
    },
  );

  it.each([
    ['16/03/2026', 'no formato brasileiro'],
    ['2026-3-16', 'sem zero à esquerda'],
    [' 2026-03-16', 'com espaço'],
    ['2026-03-16T00:00:00', 'com hora'],
    ['', 'vazia'],
  ])('recusa %s, %s', (texto) => {
    expect(criarDataDePregao(texto)).toEqual(
      err({ tipo: 'data-fora-do-formato', texto }),
    );
  });

  it.each([
    ['2026-02-29', 'fevereiro de ano comum'],
    ['1900-02-29', 'fevereiro de ano centenário'],
    ['2026-02-30', 'fevereiro'],
    ['2026-04-31', 'abril tem 30 dias'],
    ['2026-06-31', 'junho tem 30 dias'],
    ['2026-09-31', 'setembro tem 30 dias'],
    ['2026-11-31', 'novembro tem 30 dias'],
    ['2026-13-01', 'mês 13'],
    ['2026-00-10', 'mês zero'],
    ['2026-03-00', 'dia zero'],
    ['2026-03-32', 'dia 32'],
  ])('recusa %s, inexistente (%s)', (texto) => {
    expect(criarDataDePregao(texto)).toEqual(
      err({ tipo: 'data-inexistente', texto }),
    );
  });
});

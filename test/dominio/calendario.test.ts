import { describe, expect, it } from 'vitest';

import {
  CalendarioDeDiasUteis,
  calendarioNacional,
} from '../../src/dominio/calendario.js';
import {
  criarDataDoCalendario,
  type DataDoCalendario,
} from '../../src/dominio/data-do-calendario.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';
import { mes } from './referencias.js';

function data(texto: string): DataDoCalendario {
  return extrair(criarDataDoCalendario(texto));
}

function ultimoDiaUtil(texto: string): string {
  return extrair(calendarioNacional.ultimoDiaUtil(mes(texto)));
}

// #region calendario-agenda
describe('Calendário: o último dia útil do mês', () => {
  it('dezembro de 2025 termina no dia 30, como na agenda', () => {
    expect(ultimoDiaUtil('2025-12')).toBe('2025-12-30');
  });

  it.each([
    ['2026-05', '2026-05-29', 'o fim de semana fica de fora'],
    ['2026-07', '2026-07-31', 'uma sexta-feira'],
    ['2026-01', '2026-01-30', 'o dia 31 é um sábado'],
    ['2026-12', '2026-12-30', 'o 31 de dezembro fica de fora'],
  ])('%s: %s (%s)', (texto, esperado) => {
    expect(ultimoDiaUtil(texto)).toBe(esperado);
  });
});
// #endregion

// Cada linha da lista tem um exemplo, num dia de semana: sem ele, o
// feriado poderia sumir da lista sem que nenhum teste notasse.
describe('Calendário: dia útil', () => {
  it.each([
    ['2026-03-16', true, 'segunda-feira comum'],
    ['2026-03-14', false, 'sábado'],
    ['2026-03-15', false, 'domingo'],
    ['2026-01-01', false, 'Confraternização Universal'],
    ['2026-04-21', false, 'Tiradentes'],
    ['2026-05-01', false, 'Dia do Trabalho'],
    ['2026-09-07', false, 'Independência'],
    ['2026-10-12', false, 'Nossa Senhora Aparecida'],
    ['2026-11-02', false, 'Finados'],
    ['2027-11-15', false, 'Proclamação da República'],
    ['2026-11-20', false, 'Consciência Negra'],
    ['2026-12-25', false, 'Natal'],
    ['2026-12-31', false, 'o 31 de dezembro'],
    ['2024-11-20', false, 'Consciência Negra no primeiro ano'],
    ['2023-11-20', true, 'Consciência Negra antes da Lei 14.759'],
  ])('%s: %s (%s)', (texto, esperado) => {
    expect(calendarioNacional.ehDiaUtil(data(texto))).toBe(esperado);
  });

  it('recusa o mês em que nenhum dia é útil', () => {
    const todos = mes('2026-02')
      .dias()
      .map((dia) => ({ diaDoAno: dia.slice(5) }));
    const semDiaUtil = CalendarioDeDiasUteis.com(todos);

    expect(semDiaUtil.ultimoDiaUtil(mes('2026-02'))).toEqual(
      err({ tipo: 'mes-sem-dia-util', mes: mes('2026-02') }),
    );
  });
});

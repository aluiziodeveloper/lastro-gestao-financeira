import { describe, expect, it } from 'vitest';

import { dataEmSaoPaulo } from '../../src/dominio/data-do-calendario.js';

// #region data-em-sao-paulo-teste
// Os instantes vão em UTC, com o Z no fim, e o dia esperado é o de São
// Paulo. A fronteira é às 03h00 UTC, a meia-noite de lá; no horário
// de verão, que acabou em 2019, era às 02h00, e um deslocamento fixo
// de três horas erraria o dia.
describe('dataEmSaoPaulo', () => {
  it.each([
    ['2026-10-31T23:59:59Z', '2026-10-31', 'fim do dia em UTC'],
    ['2026-11-01T00:30:00Z', '2026-10-31', 'o workflow noturno da CI'],
    ['2026-11-01T02:59:59Z', '2026-10-31', 'último segundo de outubro'],
    ['2026-11-01T03:00:00Z', '2026-11-01', 'meia-noite em São Paulo'],
    ['2027-01-01T00:30:00Z', '2026-12-31', 'o ano ainda não virou'],
    [
      '2018-12-01T01:59:59Z',
      '2018-11-30',
      'antes da meia-noite de verão',
    ],
    ['2018-12-01T02:30:00Z', '2018-12-01', 'horário de verão de 2018'],
  ])('%s é %s em São Paulo (%s)', (instante, data) => {
    expect(dataEmSaoPaulo(new Date(instante))).toBe(data);
  });
});
// #endregion

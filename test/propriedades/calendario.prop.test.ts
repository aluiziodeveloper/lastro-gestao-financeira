import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { calendarioNacional } from '../../src/dominio/calendario.js';
import { extrair } from '../apoio/resultado.js';
import { mes } from '../dominio/referencias.js';

// Um mês qualquer de 2024 a 2035.
const umMes = fc
  .record({
    ano: fc.integer({ min: 2024, max: 2035 }),
    numero: fc.integer({ min: 1, max: 12 }),
  })
  .map(({ ano, numero }) =>
    mes(`${String(ano)}-${String(numero).padStart(2, '0')}`),
  );

// #region prop-ultimo-dia-util
describe('Calendário · propriedades', () => {
  it('o último dia útil é útil, do mês, e nenhum depois dele é', () => {
    fc.assert(
      fc.property(umMes, (mesSorteado) => {
        const ultimo = extrair(
          calendarioNacional.ultimoDiaUtil(mesSorteado),
        );
        const depois = mesSorteado.dias().filter((dia) => dia > ultimo);

        expect(calendarioNacional.ehDiaUtil(ultimo)).toBe(true);
        expect(mesSorteado.contem(ultimo)).toBe(true);
        expect(
          depois.some((dia) => calendarioNacional.ehDiaUtil(dia)),
        ).toBe(false);
      }),
    );
  });
});
// #endregion

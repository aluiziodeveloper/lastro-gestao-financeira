import fc from 'fast-check';
import { expect, it } from 'vitest';

// #region filtro-excessivo
// Os dois descartam 999 de cada 1.000 números gerados. O filter gera de
// novo, em silêncio, até achar um múltiplo de mil; o fc.pre conta os
// descartes e desiste, com um aviso.
const multiplosDeMil = fc
  .integer({ min: 1, max: 1_000_000 })
  .filter((numero) => numero % 1_000 === 0);

it('passa sem avisar quanto o filter descartou', () => {
  fc.assert(
    fc.property(multiplosDeMil, (numero) => {
      expect(numero % 10).toBe(0);
    }),
  );
});

// A falha é o objeto do exemplo: it.fails a mantém na suíte verde.
it.fails('falha quando a pré-condição descarta quase tudo', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 1_000_000 }), (numero) => {
      fc.pre(numero % 1_000 === 0);
      expect(numero % 10).toBe(0);
    }),
  );
});
// #endregion

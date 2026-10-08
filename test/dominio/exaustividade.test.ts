import { describe, expect, it } from 'vitest';

import { garantirExaustividade } from '../../src/dominio/exaustividade.js';

describe('garantirExaustividade', () => {
  it('lança diante de um valor que burlou os tipos', () => {
    expect(() =>
      garantirExaustividade('transferencia' as never),
    ).toThrow('Caso não tratado: "transferencia"');
  });
});

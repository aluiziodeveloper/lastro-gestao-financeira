import { describe, expect, it } from 'vitest';

import { criarIdDeOperacao } from '../../src/dominio/id-de-operacao.js';
import { err, ok } from '../../src/dominio/resultado.js';

describe('IdDeOperacao', () => {
  it('aceita um identificador e remove espaços nas pontas', () => {
    expect(criarIdDeOperacao(' op-001 ')).toEqual(ok('op-001'));
  });

  it.each(['', '   '])('recusa identificador vazio: %j', (texto) => {
    expect(criarIdDeOperacao(texto)).toEqual(
      err({ tipo: 'id-de-operacao-vazio' }),
    );
  });
});

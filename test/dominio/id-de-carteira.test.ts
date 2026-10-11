import { describe, expect, it } from 'vitest';

import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { err, ok } from '../../src/dominio/resultado.js';

describe('IdDeCarteira', () => {
  it('aceita um identificador e remove espaços nas pontas', () => {
    expect(criarIdDeCarteira(' carteira-1 ')).toEqual(ok('carteira-1'));
  });

  it.each(['', '   '])('recusa identificador vazio: %j', (texto) => {
    expect(criarIdDeCarteira(texto)).toEqual(
      err({ tipo: 'id-de-carteira-vazio' }),
    );
  });
});

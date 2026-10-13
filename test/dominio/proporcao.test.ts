import { describe, expect, it } from 'vitest';

import { Proporcao } from '../../src/dominio/proporcao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { extrair } from '../apoio/resultado.js';

function proporcao(de: number, para: number): Proporcao {
  return Proporcao.entre(
    extrair(Quantidade.criar(de)),
    extrair(Quantidade.criar(para)),
  );
}

describe('Proporcao', () => {
  it('equivale a outra com os mesmos termos', () => {
    expect(proporcao(1, 2)).toEqual(proporcao(1, 2));
  });

  it('não equivale à proporção invertida', () => {
    expect(proporcao(1, 2)).not.toEqual(proporcao(2, 1));
  });

  it('não equivale à proporção com um só termo diferente', () => {
    expect(proporcao(1, 2)).not.toEqual(proporcao(1, 3));
  });

  it('mostra os termos na mensagem de falha', () => {
    expect(() => {
      expect(proporcao(1, 2)).toEqual(proporcao(10, 1));
    }).toThrow(
      'expected Proporcao(1:2) to deeply equal Proporcao(10:1)',
    );
  });
});

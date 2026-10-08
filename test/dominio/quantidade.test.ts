import { describe, expect, it } from 'vitest';

import { Quantidade } from '../../src/dominio/quantidade.js';

// #region quantidade-teste
describe('Quantidade', () => {
  it('equivale a outra Quantidade com as mesmas unidades', () => {
    expect(Quantidade.de(100)).toEqual(Quantidade.de(100));
  });

  it('não equivale a uma Quantidade com unidades diferentes', () => {
    expect(Quantidade.de(100)).not.toEqual(Quantidade.de(200));
  });

  it('aceita o maior inteiro exato de um number', () => {
    expect(() => Quantidade.de(Number.MAX_SAFE_INTEGER)).not.toThrow();
  });

  it('converte as unidades para bigint sem perda', () => {
    expect(Quantidade.de(Number.MAX_SAFE_INTEGER).paraBigInt()).toBe(
      9_007_199_254_740_991n,
    );
  });

  it('mostra as unidades na mensagem de falha', () => {
    expect(() => {
      expect(Quantidade.de(100)).toEqual(Quantidade.de(200));
    }).toThrow(
      'expected Quantidade(100) to deeply equal Quantidade(200)',
    );
  });

  it.each([
    ['zero', 0],
    ['negativa', -1],
    ['fracionária', 1.5],
    ['acima do maior inteiro exato', Number.MAX_SAFE_INTEGER + 1],
    ['NaN', Number.NaN],
    ['infinita', Number.POSITIVE_INFINITY],
  ])('rejeita quantidade %s', (_descricao, unidades) => {
    expect(() => Quantidade.de(unidades)).toThrow(RangeError);
  });
});
// #endregion

import { describe, expect, it } from 'vitest';

import { Quantidade } from '../../src/dominio/quantidade.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';

// #region quantidade-teste
describe('Quantidade', () => {
  it('equivale a outra Quantidade com as mesmas unidades', () => {
    expect(extrair(Quantidade.criar(100))).toEqual(
      extrair(Quantidade.criar(100)),
    );
  });

  it('não equivale a uma Quantidade com unidades diferentes', () => {
    expect(extrair(Quantidade.criar(100))).not.toEqual(
      extrair(Quantidade.criar(200)),
    );
  });

  it('aceita o maior inteiro exato de um number', () => {
    expect(Quantidade.criar(Number.MAX_SAFE_INTEGER).ok).toBe(true);
  });

  it('converte as unidades para bigint sem perda', () => {
    const maior = extrair(Quantidade.criar(Number.MAX_SAFE_INTEGER));
    expect(maior.paraBigInt()).toBe(9_007_199_254_740_991n);
  });

  it('mostra as unidades na mensagem de falha', () => {
    expect(() => {
      expect(extrair(Quantidade.criar(100))).toEqual(
        extrair(Quantidade.criar(200)),
      );
    }).toThrow(
      'expected Quantidade(100) to deeply equal Quantidade(200)',
    );
  });
});
// #endregion

// #region quantidade-erros-teste
describe('Quantidade: erros', () => {
  it.each([
    ['zero', 0, 'quantidade-nao-positiva'],
    ['negativa', -1, 'quantidade-nao-positiva'],
    ['fracionária', 1.5, 'quantidade-nao-inteira'],
    ['NaN', Number.NaN, 'quantidade-nao-inteira'],
    ['infinita', Number.POSITIVE_INFINITY, 'quantidade-nao-inteira'],
    [
      'acima do maior inteiro exato',
      Number.MAX_SAFE_INTEGER + 1,
      'quantidade-acima-do-limite',
    ],
  ] as const)('recusa quantidade %s', (_descricao, unidades, tipo) => {
    expect(Quantidade.criar(unidades)).toEqual(err({ tipo, unidades }));
  });
});
// #endregion

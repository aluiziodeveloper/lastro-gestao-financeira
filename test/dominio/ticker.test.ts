import { describe, expect, it } from 'vitest';

import { err } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';

// #region ticker-teste
describe('Ticker', () => {
  it('normaliza espaços nas pontas e letras minúsculas', () => {
    expect(extrair(Ticker.criar(' petr4 '))).toEqual(
      extrair(Ticker.criar('PETR4')),
    );
  });

  it('não equivale a outro código', () => {
    expect(extrair(Ticker.criar('PETR4'))).not.toEqual(
      extrair(Ticker.criar('PETR3')),
    );
  });

  it('aceita código com dois dígitos', () => {
    expect(extrair(Ticker.criar('BOVA11'))).toEqual(
      extrair(Ticker.criar('bova11')),
    );
  });

  it.each([
    ['vazio', ''],
    ['sem dígito', 'PETR'],
    ['com três letras', 'PET4'],
    ['com cinco letras', 'XPETR4'],
    ['com três dígitos', 'PETR123'],
    ['com espaço no meio', 'PETR 4'],
    ['do mercado fracionário', 'PETR4F'],
    ['com letra acentuada', 'ÇETR4'],
    ['só com símbolos', '???'],
  ])('recusa código %s', (_descricao, texto) => {
    expect(Ticker.criar(texto)).toEqual(
      err({ tipo: 'ticker-fora-do-formato', texto }),
    );
  });

  it('mostra o código na mensagem de falha', () => {
    expect(() => {
      expect(extrair(Ticker.criar('PETR4'))).toEqual(
        extrair(Ticker.criar('VALE3')),
      );
    }).toThrow('expected Ticker(PETR4) to deeply equal Ticker(VALE3)');
  });
});
// #endregion

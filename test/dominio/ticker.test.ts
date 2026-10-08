import { describe, expect, it } from 'vitest';

import { Ticker } from '../../src/dominio/ticker.js';

// #region ticker-teste
describe('Ticker', () => {
  it('normaliza espaços nas pontas e letras minúsculas', () => {
    expect(Ticker.de(' petr4 ')).toEqual(Ticker.de('PETR4'));
  });

  it('não equivale a outro código', () => {
    expect(Ticker.de('PETR4')).not.toEqual(Ticker.de('PETR3'));
  });

  it('aceita código com dois dígitos', () => {
    expect(Ticker.de('BOVA11')).toEqual(Ticker.de('bova11'));
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
  ])('rejeita código %s', (_descricao, texto) => {
    expect(() => Ticker.de(texto)).toThrow(
      `Ticker fora do formato da B3: '${texto}'`,
    );
  });

  it('mostra o código na mensagem de falha', () => {
    expect(() => {
      expect(Ticker.de('PETR4')).toEqual(Ticker.de('VALE3'));
    }).toThrow('expected Ticker(PETR4) to deeply equal Ticker(VALE3)');
  });
});
// #endregion

import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { FracaoDeAcao } from '../../src/dominio/fracao-de-acao.js';

function fracao(
  numerador: bigint,
  denominador: bigint,
  centavos: bigint,
) {
  return FracaoDeAcao.de(
    numerador,
    denominador,
    Dinheiro.deCentavos(centavos),
  );
}

describe('FracaoDeAcao', () => {
  it('equivale a outra com a mesma fração e o mesmo custo', () => {
    expect(fracao(5n, 10n, 307_00n)).toEqual(fracao(1n, 2n, 307_00n));
  });

  it('não equivale a outra com fração diferente', () => {
    expect(fracao(1n, 2n, 307_00n)).not.toEqual(
      fracao(1n, 3n, 307_00n),
    );
  });

  it('não equivale a outra com custo diferente', () => {
    expect(fracao(1n, 2n, 307_00n)).not.toEqual(
      fracao(1n, 2n, 307_01n),
    );
  });

  it('mostra a fração e o custo na mensagem de falha', () => {
    expect(() => {
      expect(fracao(1n, 2n, 307_00n)).toEqual(fracao(1n, 3n, 307_00n));
    }).toThrow(
      'expected FracaoDeAcao(1/2 · Dinheiro(30700 centavos)) ' +
        'to deeply equal ' +
        'FracaoDeAcao(1/3 · Dinheiro(30700 centavos))',
    );
  });
});

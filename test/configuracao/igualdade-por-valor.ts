import { expect } from 'vitest';

import type { ObjetoDeValor } from '../../src/dominio/objeto-de-valor.js';

// #region igualdade-por-valor
// O toEqual ignora campos privados com #: sem este verificador, dois
// objetos de valor com valores diferentes passariam por iguais.
function ehObjetoDeValor(
  valor: unknown,
): valor is ObjetoDeValor<unknown> {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'equivaleA' in valor &&
    typeof valor.equivaleA === 'function'
  );
}

function equivalemPorValor(
  esperado: unknown,
  recebido: unknown,
): boolean | undefined {
  if (
    ehObjetoDeValor(esperado) &&
    ehObjetoDeValor(recebido) &&
    esperado.constructor === recebido.constructor
  ) {
    return esperado.equivaleA(recebido);
  }
  return undefined;
}

expect.addEqualityTesters([equivalemPorValor]);
// #endregion

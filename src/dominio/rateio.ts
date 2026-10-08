import type { Dinheiro } from './dinheiro.js';

// #region ratear-custos
// Desafio do Capítulo 4: reparta os custos da nota entre as operações,
// na proporção do valor de cada uma (IN RFB 1.585/2015, art. 56, § 4º).
// Cada parte fica a menos de um centavo da proporção exata, e a soma
// das partes é exatamente o custo da nota. Os testes estão em
// test/dominio/rateio.test.ts.
export function ratearCustos(
  custos: Dinheiro,
  valores: readonly [Dinheiro, ...Dinheiro[]],
): readonly Dinheiro[] {
  throw new Error(
    `Desafio do Capítulo 4 não resolvido (operações: ${String(valores.length)})`,
  );
}
// #endregion

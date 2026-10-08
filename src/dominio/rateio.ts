import type { Dinheiro } from './dinheiro.js';

// #region ratear-custos
// Os custos da nota são repartidos entre as operações na proporção do
// valor de cada uma (IN RFB 1.585/2015, art. 56, § 4º). Cada parte
// fica a menos de um centavo da proporção exata, e a soma das partes é
// exatamente o custo da nota.
export function ratearCustos(
  custos: Dinheiro,
  valores: readonly [Dinheiro, ...Dinheiro[]],
): readonly Dinheiro[] {
  return custos.repartirNaProporcao(valores);
}
// #endregion

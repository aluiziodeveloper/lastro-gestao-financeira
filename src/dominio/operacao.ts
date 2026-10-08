import type { Dinheiro } from './dinheiro.js';
import type { Quantidade } from './quantidade.js';

// #region operacao-valor-bruto
export function valorBrutoDaOperacao(
  precoUnitario: Dinheiro,
  quantidade: Quantidade,
): Dinheiro {
  return precoUnitario.multiplicarPor(quantidade);
}
// #endregion

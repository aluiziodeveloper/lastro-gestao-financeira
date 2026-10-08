import type { Dinheiro } from './dinheiro.js';

// #region erros-de-operacao
// Cada erro nomeia o fato de negócio e carrega o valor que o causou.
export type ErroDeOperacao =
  | {
      readonly tipo: 'preco-nao-positivo';
      readonly precoUnitario: Dinheiro;
    }
  | { readonly tipo: 'custos-negativos'; readonly custos: Dinheiro };
// #endregion

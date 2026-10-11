import type { DataDePregao } from './data-de-pregao.js';
import type { Dinheiro } from './dinheiro.js';
import type { ErroDeEvento } from './eventos.js';
import type { ErroDeQuantidade, Quantidade } from './quantidade.js';
import type { Ticker } from './ticker.js';

// #region erros-de-operacao
// Cada erro nomeia o fato de negócio e carrega o valor que o causou.
export type ErroDeOperacao =
  | {
      readonly tipo: 'preco-nao-positivo';
      readonly precoUnitario: Dinheiro;
    }
  | { readonly tipo: 'custos-negativos'; readonly custos: Dinheiro };
// #endregion

// #region erros-de-carteira
// O erro da carteira fala a língua da regra e diz o ativo; a posição,
// que não conhece ativos, só sabe que a venda passou da quantidade.
export type ErroDeCarteira =
  | {
      readonly tipo: 'venda-a-descoberto';
      readonly ticker: Ticker;
      readonly emCarteira: Quantidade | undefined;
      readonly vendida: Quantidade;
    }
  | {
      readonly tipo: 'operacao-fora-de-ordem';
      readonly data: DataDePregao;
      readonly ultimaData: DataDePregao;
    }
  | ErroDeEvento
  | ErroDeQuantidade;
// #endregion

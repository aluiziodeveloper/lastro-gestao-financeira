import type { Dinheiro } from './dinheiro.js';
import type { Quantidade } from './quantidade.js';
import type { Ticker } from './ticker.js';

// #region operacao-uniao
// Compra e venda têm os mesmos campos; o tipo literal diz qual das duas
// a operação é, e só esses dois valores existem.
interface CamposDaOperacao {
  readonly id: string;
  readonly data: string;
  readonly ticker: Ticker;
  readonly quantidade: Quantidade;
  readonly precoUnitario: Dinheiro;
  readonly custos: Dinheiro;
}

export interface Compra extends CamposDaOperacao {
  readonly tipo: 'compra';
}

export interface Venda extends CamposDaOperacao {
  readonly tipo: 'venda';
}

export type Operacao = Compra | Venda;
// #endregion

// #region operacao-valor-bruto
export function valorBrutoDaOperacao(
  precoUnitario: Dinheiro,
  quantidade: Quantidade,
): Dinheiro {
  return precoUnitario.multiplicarPor(quantidade);
}
// #endregion

import type { ClasseDeAtivo, ErroDeCatalogo } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import type { Dinheiro } from '../dinheiro.js';
import type { ErroDeCarteira } from '../erros.js';
import type { Ticker } from '../ticker.js';

// #region apuracao-do-mes
// O resultado de uma categoria no mês: o total vendido, o resultado
// das vendas, positivo ou negativo, se o mês é isento e o imposto.
export interface ResultadoDaCategoria {
  readonly categoria: 'acoes-comum';
  readonly totalVendido: Dinheiro;
  readonly resultado: Dinheiro;
  readonly isenta: boolean;
  readonly imposto: Dinheiro;
}

// A apuração devolve também a carteira no fim do mês, de onde parte a
// apuração do mês seguinte.
export interface ApuracaoDoMes {
  readonly categorias: readonly ResultadoDaCategoria[];
  readonly carteira: Carteira;
}

export type ErroDeApuracao =
  | ErroDeCarteira
  | ErroDeCatalogo
  | {
      readonly tipo: 'classe-ainda-nao-apurada';
      readonly classe: ClasseDeAtivo;
      readonly ticker: Ticker;
    };
// #endregion

import type { ErroDeCatalogo } from '../ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import type { ErroDeCarteira } from '../erros.js';
import type { ErroSemRegime } from '../regime/regimes-tributarios.js';
import type {
  ErroDeSequencia,
  EstadoDaApuracao,
} from './estado-da-apuracao.js';
import type { MesDeApuracao } from './mes-de-apuracao.js';
import type { ErroDeSeparacao } from './pareamento.js';

// #region apuracao-do-mes
// O que se soma de cada venda de uma categoria: o valor de alienação e
// o resultado, positivo ou negativo.
export interface Totais {
  readonly totalVendido: Dinheiro;
  readonly resultado: Dinheiro;
}

export type NomeDaCategoria =
  'acoes-comum' | 'day-trade' | 'fii' | 'etf';

// O resultado de uma categoria no mês: o total vendido, o resultado
// das vendas, positivo ou negativo, se o mês é isento, o prejuízo
// compensado, a base que sobra e o imposto sobre ela.
export interface ResultadoDaCategoria {
  readonly categoria: NomeDaCategoria;
  readonly totalVendido: Dinheiro;
  readonly resultado: Dinheiro;
  readonly isenta: boolean;
  readonly compensado: Dinheiro;
  readonly base: Dinheiro;
  readonly imposto: Dinheiro;
}

// A apuração devolve também o estado no fim do mês, de onde parte a
// apuração do mês seguinte.
export interface ApuracaoDoMes {
  readonly mes: MesDeApuracao;
  readonly categorias: readonly ResultadoDaCategoria[];
  readonly estado: EstadoDaApuracao;
}

export type ErroDeApuracao =
  | ErroDeCarteira
  | ErroDeCatalogo
  | ErroDeSeparacao
  | ErroSemRegime
  | ErroDeSequencia;
// #endregion

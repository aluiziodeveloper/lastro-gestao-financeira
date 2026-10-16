import type { ErroDeCatalogo } from '../ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import type { ErroDeCarteira } from '../erros.js';
import type {
  DeducaoDoIrrf,
  ErroDeRetencao,
  ImpostoRetido,
} from '../irrf/imposto-retido.js';
import type { Operacao } from '../operacao.js';
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

// O que se apura num mês: as operações e o imposto retido nas notas.
// Um mês sem operação entra com as listas vazias: ele também avança o
// estado.
export interface MovimentoDoMes {
  readonly mes: MesDeApuracao;
  readonly operacoes: readonly Operacao[];
  readonly retencoes: readonly ImpostoRetido[];
}

// A apuração devolve também o estado no fim do mês, de onde parte a
// apuração do mês seguinte.
export interface ApuracaoDoMes {
  readonly mes: MesDeApuracao;
  readonly categorias: readonly ResultadoDaCategoria[];
  readonly irrf: DeducaoDoIrrf;
  readonly estado: EstadoDaApuracao;
}

export type ErroDeApuracao =
  | ErroDeCarteira
  | ErroDeCatalogo
  | ErroDeSeparacao
  | ErroSemRegime
  | ErroDeSequencia
  | ErroDeRetencao;
// #endregion

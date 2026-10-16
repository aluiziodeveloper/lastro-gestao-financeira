import type { CatalogoDeAtivos } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import type { Operacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import type { ErroDeApuracao, Totais } from './apuracao-do-mes.js';
import { separarDayTrade } from './day-trade.js';
import {
  type Andamento,
  type Lancamento,
  percorrer,
} from './lancamentos.js';
import { resultadoDoDayTrade } from './resultado-do-day-trade.js';

// #region lancamentos-do-mes
// Cada venda do mês vira um lançamento: as comuns passam pela
// carteira, e o day trade do mês entra como um lançamento só.
export function lancarOMes(
  carteira: Carteira,
  operacoes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<Andamento, ErroDeApuracao> {
  const separacao = separarDayTrade(operacoes);
  if (!separacao.ok) {
    return separacao;
  }
  const { comum, dayTrade } = separacao.valor;
  return juntar(
    percorrer(carteira, comum, catalogo),
    resultadoDoDayTrade(dayTrade, catalogo),
  );
}
// #endregion

function juntar(
  comum: Result<Andamento, ErroDeApuracao>,
  dayTrade: Result<Totais, ErroDeApuracao>,
): Result<Andamento, ErroDeApuracao> {
  if (!comum.ok) {
    return comum;
  }
  if (!dayTrade.ok) {
    return dayTrade;
  }
  const lancamento: Lancamento = {
    categoria: 'day-trade',
    ...dayTrade.valor,
  };
  const { carteira, lancamentos } = comum.valor;
  return ok({ carteira, lancamentos: [...lancamentos, lancamento] });
}

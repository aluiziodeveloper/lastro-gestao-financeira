import type { Carteira } from '../carteira.js';
import type { DadosDeReferencia } from '../dados-de-referencia.js';
import type { Operacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
  Totais,
} from './apuracao-do-mes.js';
import type { CategoriaDeApuracao } from './categoria.js';
import { categoriasDo } from './categorias.js';
import { separarDayTrade } from './day-trade.js';
import {
  type Andamento,
  type Lancamento,
  percorrer,
  totaisDe,
} from './lancamentos.js';
import type { MesDeApuracao } from './mes-de-apuracao.js';
import { resultadoDoDayTrade } from './resultado-do-day-trade.js';

// #region apuracao-mensal
// Serviço de domínio: a apuração não pertence à carteira nem ao
// catálogo. Ela resolve a lei do mês, separa o day trade, passa o
// resto pela carteira e entrega a cada categoria os totais dela. Tudo
// o que o cálculo usa chega pelos parâmetros: o mesmo mês, com os
// mesmos dados, dá sempre a mesma apuração.
export function apurarMes(
  mes: MesDeApuracao,
  carteira: Carteira,
  operacoes: readonly Operacao[],
  referencias: DadosDeReferencia,
): Result<ApuracaoDoMes, ErroDeApuracao> {
  const { catalogo, regimes } = referencias;
  const regime = regimes.vigenteEm(mes.primeiroDia());
  if (!regime.ok) {
    return regime;
  }
  const separacao = separarDayTrade(operacoes);
  if (!separacao.ok) {
    return separacao;
  }
  const { comum, dayTrade } = separacao.valor;
  return fechar(
    categoriasDo(regime.valor.apuracao),
    percorrer(carteira, comum, catalogo),
    resultadoDoDayTrade(dayTrade, catalogo),
  );
}

function fechar(
  categorias: readonly CategoriaDeApuracao[],
  comum: Result<Andamento, ErroDeApuracao>,
  dayTrade: Result<Totais, ErroDeApuracao>,
): Result<ApuracaoDoMes, ErroDeApuracao> {
  if (!comum.ok) {
    return comum;
  }
  if (!dayTrade.ok) {
    return dayTrade;
  }
  const lancamentos: readonly Lancamento[] = [
    ...comum.valor.lancamentos,
    { categoria: 'day-trade', ...dayTrade.valor },
  ];
  return ok({
    categorias: categorias.map((categoria) =>
      categoria.apurar(totaisDe(categoria.nome, lancamentos)),
    ),
    carteira: comum.valor.carteira,
  });
}
// #endregion

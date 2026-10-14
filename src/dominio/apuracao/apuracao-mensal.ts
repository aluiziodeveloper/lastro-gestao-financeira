import type { CatalogoDeAtivos } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import type { Operacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
  Totais,
} from './apuracao-do-mes.js';
import { categoriasDoMes } from './categorias.js';
import { separarDayTrade } from './day-trade.js';
import {
  type Andamento,
  type Lancamento,
  percorrer,
  totaisDe,
} from './lancamentos.js';
import { resultadoDoDayTrade } from './resultado-do-day-trade.js';

// #region apuracao-mensal
// Serviço de domínio: a apuração não pertence à carteira nem ao
// catálogo. Ela separa o day trade, passa o resto pela carteira e
// entrega a cada categoria os totais que são dela.
export function apurarMes(
  carteira: Carteira,
  operacoes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<ApuracaoDoMes, ErroDeApuracao> {
  const separacao = separarDayTrade(operacoes);
  if (!separacao.ok) {
    return separacao;
  }
  const { comum, dayTrade } = separacao.valor;
  return fechar(
    percorrer(carteira, comum, catalogo),
    resultadoDoDayTrade(dayTrade, catalogo),
  );
}

function fechar(
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
    categorias: categoriasDoMes.map((categoria) =>
      categoria.apurar(totaisDe(categoria.nome, lancamentos)),
    ),
    carteira: comum.valor.carteira,
  });
}
// #endregion

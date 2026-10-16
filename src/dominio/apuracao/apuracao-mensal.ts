import type { CatalogoDeAtivos } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import type { DadosDeReferencia } from '../dados-de-referencia.js';
import type { Operacao } from '../operacao.js';
import { compensar } from '../prejuizo/compensacao.js';
import type { PrejuizoAcumulado } from '../prejuizo/prejuizo-acumulado.js';
import type { RegimeTributario } from '../regime/regime-tributario.js';
import { ok, type Result } from '../resultado.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
  Totais,
} from './apuracao-do-mes.js';
import { categoriasDo } from './categorias.js';
import { separarDayTrade } from './day-trade.js';
import {
  conferirSequencia,
  type EstadoDaApuracao,
} from './estado-da-apuracao.js';
import {
  type Andamento,
  type Lancamento,
  percorrer,
} from './lancamentos.js';
import type { MesDeApuracao } from './mes-de-apuracao.js';
import { resultadoDoDayTrade } from './resultado-do-day-trade.js';

// #region apuracao-mensal
// Serviço de domínio: a apuração não pertence à carteira nem ao
// catálogo. Ela confere que o mês segue o último apurado, resolve a
// lei do mês, separa o day trade, passa o resto pela carteira e
// entrega a cada categoria os totais dela, com o prejuízo do estado.
// Tudo o que o cálculo usa chega pelos parâmetros: o mesmo mês, com o
// mesmo estado e os mesmos dados, dá sempre a mesma apuração.
export function apurarMes(
  mes: MesDeApuracao,
  estado: EstadoDaApuracao,
  operacoes: readonly Operacao[],
  referencias: DadosDeReferencia,
): Result<ApuracaoDoMes, ErroDeApuracao> {
  const { catalogo, regimes } = referencias;
  const sequencia = conferirSequencia(mes, estado);
  if (!sequencia.ok) {
    return sequencia;
  }
  const regime = regimes.vigenteEm(mes.primeiroDia());
  if (!regime.ok) {
    return regime;
  }
  const andamento = lancarOMes(estado.carteira, operacoes, catalogo);
  if (!andamento.ok) {
    return andamento;
  }
  return ok(
    fechar(mes, regime.valor, estado.prejuizo, andamento.valor),
  );
}

// Cada venda do mês vira um lançamento: as comuns passam pela
// carteira, e o day trade do mês entra como um lançamento só.
function lancarOMes(
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

// As categorias do regime apuram os lançamentos com o prejuízo do
// estado, e o mês devolve o estado seguinte.
function fechar(
  mes: MesDeApuracao,
  regime: RegimeTributario,
  prejuizo: PrejuizoAcumulado,
  { carteira, lancamentos }: Andamento,
): ApuracaoDoMes {
  const categorias = categoriasDo(regime.apuracao);
  const compensacao = compensar(categorias, lancamentos, prejuizo);
  return {
    mes,
    categorias: compensacao.categorias,
    estado: {
      apuradoAte: mes,
      carteira,
      prejuizo: compensacao.prejuizo,
    },
  };
}
// #endregion

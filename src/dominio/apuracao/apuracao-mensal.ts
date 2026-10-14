import type { CatalogoDeAtivos } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import type { Operacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
} from './apuracao-do-mes.js';
import { separarDayTrade } from './day-trade.js';
import {
  acoesEmOperacaoComum,
  type Andamento,
  noDayTrade,
  somarVenda,
} from './por-classe.js';
import { registrarNaCarteira } from './resultado-da-venda.js';
import {
  type ResultadoDoDayTrade,
  resultadoDoDayTrade,
} from './resultado-do-day-trade.js';

const zero = Dinheiro.deCentavos(0n);

// #region apuracao-mensal
// Serviço de domínio: a apuração não pertence à carteira nem ao
// catálogo. Ela separa o day trade, passa o resto pela carteira,
// operação por operação, e aplica a lei a cada categoria.
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
  dayTrade: Result<ResultadoDoDayTrade, ErroDeApuracao>,
): Result<ApuracaoDoMes, ErroDeApuracao> {
  if (!comum.ok) {
    return comum;
  }
  if (!dayTrade.ok) {
    return dayTrade;
  }
  return ok({
    categorias: [
      acoesEmOperacaoComum(comum.valor),
      noDayTrade(dayTrade.valor),
    ],
    carteira: comum.valor.carteira,
  });
}
// #endregion

function percorrer(
  carteira: Carteira,
  operacoes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<Andamento, ErroDeApuracao> {
  const inicio: Result<Andamento, ErroDeApuracao> = ok({
    carteira,
    totalVendido: zero,
    resultado: zero,
  });
  return operacoes.reduce(
    (andamento, operacao) =>
      andamento.ok
        ? registrar(andamento.valor, operacao, catalogo)
        : andamento,
    inicio,
  );
}

function registrar(
  andamento: Andamento,
  operacao: Operacao,
  catalogo: CatalogoDeAtivos,
): Result<Andamento, ErroDeApuracao> {
  const registro = registrarNaCarteira(andamento.carteira, operacao);
  if (!registro.ok) {
    return registro;
  }
  const { carteira, venda } = registro.valor;
  if (venda === undefined) {
    return ok({ ...andamento, carteira });
  }
  return somarVenda({ ...andamento, carteira }, venda, catalogo);
}

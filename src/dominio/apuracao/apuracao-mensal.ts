import type { DadosDeReferencia } from '../dados-de-referencia.js';
import { ok, type Result } from '../resultado.js';
import { abrir } from './abertura-do-mes.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
  MovimentoDoMes,
} from './apuracao-do-mes.js';
import type { EstadoDaApuracao } from './estado-da-apuracao.js';
import { fechar } from './fechamento-do-mes.js';
import { lancarOMes } from './lancamentos-do-mes.js';

// #region apuracao-mensal
// Serviço de domínio: a apuração não pertence à carteira nem ao
// catálogo. Ela abre o mês (a sequência, a lei, o imposto retido e o
// vencimento), lança as vendas e fecha: as categorias apuram com o
// prejuízo do estado, o retido abate o imposto, e o que sobra vai ao
// DARF. Tudo o que o cálculo usa chega pelos parâmetros: o mesmo
// estado, com o mesmo movimento e os mesmos dados, dá sempre a mesma
// apuração.
export function apurarMes(
  estado: EstadoDaApuracao,
  movimento: MovimentoDoMes,
  referencias: DadosDeReferencia,
): Result<ApuracaoDoMes, ErroDeApuracao> {
  const abertura = abrir(estado, movimento, referencias);
  if (!abertura.ok) {
    return abertura;
  }
  const andamento = lancarOMes(
    estado.carteira,
    movimento.operacoes,
    referencias.catalogo,
  );
  if (!andamento.ok) {
    return andamento;
  }
  return ok(fechar(estado, abertura.valor, andamento.valor));
}
// #endregion

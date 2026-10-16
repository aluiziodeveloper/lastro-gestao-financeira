import type { DadosDeReferencia } from '../dados-de-referencia.js';
import { ok, type Result } from '../resultado.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
  MovimentoDoMes,
} from './apuracao-do-mes.js';
import { apurarMes } from './apuracao-mensal.js';
import type { EstadoDaApuracao } from './estado-da-apuracao.js';

// #region dobra-dos-meses
export interface ApuracaoDosMeses {
  readonly apuracoes: readonly ApuracaoDoMes[];
  readonly estado: EstadoDaApuracao;
}

// A dobra sobre os meses: cada mês recebe o estado que o anterior
// devolveu. O primeiro erro interrompe a sequência, como no Result do
// Capítulo 9.
export function apurarMeses(
  movimentos: readonly MovimentoDoMes[],
  inicial: EstadoDaApuracao,
  referencias: DadosDeReferencia,
): Result<ApuracaoDosMeses, ErroDeApuracao> {
  const inicio: Result<ApuracaoDosMeses, ErroDeApuracao> = ok({
    apuracoes: [],
    estado: inicial,
  });
  return movimentos.reduce(
    (andamento, movimento) =>
      andamento.ok
        ? seguir(andamento.valor, movimento, referencias)
        : andamento,
    inicio,
  );
}

function seguir(
  { apuracoes, estado }: ApuracaoDosMeses,
  movimento: MovimentoDoMes,
  referencias: DadosDeReferencia,
): Result<ApuracaoDosMeses, ErroDeApuracao> {
  const apuracao = apurarMes(estado, movimento, referencias);
  if (!apuracao.ok) {
    return apuracao;
  }
  return ok({
    apuracoes: [...apuracoes, apuracao.valor],
    estado: apuracao.valor.estado,
  });
}
// #endregion

import type { DadosDeReferencia } from '../dados-de-referencia.js';
import type { Operacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
} from './apuracao-do-mes.js';
import { apurarMes } from './apuracao-mensal.js';
import type { EstadoDaApuracao } from './estado-da-apuracao.js';
import type { MesDeApuracao } from './mes-de-apuracao.js';

// #region dobra-dos-meses
// Um mês e as operações dele. Um mês sem operação entra com a lista
// vazia: ele também avança o estado.
export interface MesComOperacoes {
  readonly mes: MesDeApuracao;
  readonly operacoes: readonly Operacao[];
}

export interface ApuracaoDosMeses {
  readonly apuracoes: readonly ApuracaoDoMes[];
  readonly estado: EstadoDaApuracao;
}

// A dobra sobre os meses: cada mês recebe o estado que o anterior
// devolveu. O primeiro erro interrompe a sequência, como no Result do
// Capítulo 9.
export function apurarMeses(
  meses: readonly MesComOperacoes[],
  inicial: EstadoDaApuracao,
  referencias: DadosDeReferencia,
): Result<ApuracaoDosMeses, ErroDeApuracao> {
  const inicio: Result<ApuracaoDosMeses, ErroDeApuracao> = ok({
    apuracoes: [],
    estado: inicial,
  });
  return meses.reduce(
    (andamento, { mes, operacoes }) =>
      andamento.ok
        ? seguir(andamento.valor, mes, operacoes, referencias)
        : andamento,
    inicio,
  );
}

function seguir(
  { apuracoes, estado }: ApuracaoDosMeses,
  mes: MesDeApuracao,
  operacoes: readonly Operacao[],
  referencias: DadosDeReferencia,
): Result<ApuracaoDosMeses, ErroDeApuracao> {
  const apuracao = apurarMes(mes, estado, operacoes, referencias);
  if (!apuracao.ok) {
    return apuracao;
  }
  return ok({
    apuracoes: [...apuracoes, apuracao.valor],
    estado: apuracao.valor.estado,
  });
}
// #endregion

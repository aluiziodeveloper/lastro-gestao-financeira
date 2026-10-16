import type { DadosDeReferencia } from '../dados-de-referencia.js';
import type { DataDoCalendario } from '../data-do-calendario.js';
import type { Dinheiro } from '../dinheiro.js';
import { retidoNoMes } from '../irrf/imposto-retido.js';
import type { RegimeTributario } from '../regime/regime-tributario.js';
import { ok, type Result } from '../resultado.js';
import type {
  ErroDeApuracao,
  MovimentoDoMes,
} from './apuracao-do-mes.js';
import {
  conferirSequencia,
  type EstadoDaApuracao,
} from './estado-da-apuracao.js';
import type { MesDeApuracao } from './mes-de-apuracao.js';

// #region abertura-do-mes
// O que o mês precisa saber antes de lançar as vendas: a lei do mês,
// o imposto retido nas notas e o vencimento do DARF.
export interface Abertura {
  readonly mes: MesDeApuracao;
  readonly regime: RegimeTributario;
  readonly retido: Dinheiro;
  readonly vencimento: DataDoCalendario;
}

// O mês só abre depois do último apurado.
export function abrir(
  estado: EstadoDaApuracao,
  movimento: MovimentoDoMes,
  referencias: DadosDeReferencia,
): Result<Abertura, ErroDeApuracao> {
  const sequencia = conferirSequencia(movimento.mes, estado);
  if (!sequencia.ok) {
    return sequencia;
  }
  return lerOMes(movimento, referencias);
}

function lerOMes(
  { mes, retencoes }: MovimentoDoMes,
  { regimes, calendario }: DadosDeReferencia,
): Result<Abertura, ErroDeApuracao> {
  const regime = regimes.vigenteEm(mes.primeiroDia());
  if (!regime.ok) {
    return regime;
  }
  const retido = retidoNoMes(mes, retencoes);
  if (!retido.ok) {
    return retido;
  }
  const vencimento = calendario.ultimoDiaUtil(mes.seguinte());
  if (!vencimento.ok) {
    return vencimento;
  }
  return ok({
    mes,
    regime: regime.valor,
    retido: retido.valor,
    vencimento: vencimento.valor,
  });
}
// #endregion

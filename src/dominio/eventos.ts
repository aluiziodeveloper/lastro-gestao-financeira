import type { DataDePregao } from './data-de-pregao.js';
import type { IdDeOperacao } from './id-de-operacao.js';
import type { Posicao } from './posicao.js';
import type { Proporcao } from './proporcao.js';
import type { ErroDeQuantidade } from './quantidade.js';
import { err, type Result } from './resultado.js';
import type { Ticker } from './ticker.js';

// #region evento-corporativo
export interface EventoCorporativo {
  readonly tipo: 'desdobramento' | 'grupamento';
  readonly id: IdDeOperacao;
  readonly data: DataDePregao;
  readonly ticker: Ticker;
  readonly proporcao: Proporcao;
}

export type CamposDoEvento = Omit<EventoCorporativo, 'tipo'>;

export type ErroDeEvento =
  | { readonly tipo: 'proporcao-invalida'; readonly evento: string }
  | ErroDeQuantidade;

export function criarDesdobramento(
  campos: CamposDoEvento,
): EventoCorporativo {
  return { ...campos, tipo: 'desdobramento' };
}

export function criarGrupamento(
  campos: CamposDoEvento,
): EventoCorporativo {
  return { ...campos, tipo: 'grupamento' };
}
// #endregion

// #region processar-evento-primeira-versao
export function processarEvento(
  posicao: Posicao,
  evento: EventoCorporativo,
): Result<Posicao, ErroDeEvento> {
  const para = evento.proporcao.para().paraBigInt();
  const de = evento.proporcao.de().paraBigInt();
  if (evento.tipo === 'desdobramento') {
    if (para > de) {
      return posicao.aplicarProporcao(evento.proporcao);
    } else {
      return err({ tipo: 'proporcao-invalida', evento: evento.tipo });
    }
  } else {
    if (de > para) {
      return posicao.aplicarProporcao(evento.proporcao);
    } else {
      return err({ tipo: 'proporcao-invalida', evento: evento.tipo });
    }
  }
}
// #endregion

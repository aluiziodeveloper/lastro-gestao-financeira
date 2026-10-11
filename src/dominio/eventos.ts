import type { DataDePregao } from './data-de-pregao.js';
import type { IdDeOperacao } from './id-de-operacao.js';
import type { FracaoDeAcao } from './fracao-de-acao.js';
import type { Posicao } from './posicao.js';
import type { Proporcao } from './proporcao.js';
import type { ErroDeQuantidade } from './quantidade.js';
import { err, type Result } from './resultado.js';
import type { Ticker } from './ticker.js';

// #region evento-corporativo
// Cada evento sabe se aplicar a uma posição. Um tipo novo de evento
// entra com uma fábrica nova, sem mudar quem aplica os eventos.
export interface EventoCorporativo {
  readonly id: IdDeOperacao;
  readonly data: DataDePregao;
  readonly ticker: Ticker;
  aplicarA(posicao: Posicao): Result<EventoAplicado, ErroDeEvento>;
}

// A posição depois do evento e a fração de ação que sobrou, se houver.
export interface EventoAplicado {
  readonly posicao: Posicao;
  readonly fracao: FracaoDeAcao | undefined;
}

export interface CamposDoEvento {
  readonly id: IdDeOperacao;
  readonly data: DataDePregao;
  readonly ticker: Ticker;
  readonly proporcao: Proporcao;
}

export type ErroDeEvento =
  | { readonly tipo: 'proporcao-invalida'; readonly evento: string }
  | ErroDeQuantidade;
// #endregion

// #region evento-desdobramento
export function criarDesdobramento(
  campos: CamposDoEvento,
): EventoCorporativo {
  const { id, data, ticker, proporcao } = campos;
  return {
    id,
    data,
    ticker,
    aplicarA(posicao) {
      if (!proporcao.aumenta()) {
        return err({
          tipo: 'proporcao-invalida',
          evento: 'desdobramento',
        });
      }
      return posicao.aplicarProporcao(proporcao);
    },
  };
}
// #endregion

// #region evento-grupamento
export function criarGrupamento(
  campos: CamposDoEvento,
): EventoCorporativo {
  const { id, data, ticker, proporcao } = campos;
  return {
    id,
    data,
    ticker,
    aplicarA(posicao) {
      if (!proporcao.diminui()) {
        return err({
          tipo: 'proporcao-invalida',
          evento: 'grupamento',
        });
      }
      return posicao.aplicarProporcao(proporcao);
    },
  };
}
// #endregion

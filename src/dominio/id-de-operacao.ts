import type { Marcado } from './marca.js';
import { err, ok, type Result } from './resultado.js';

// #region id-de-operacao
export type IdDeOperacao = Marcado<string, 'IdDeOperacao'>;

export interface ErroDeIdDeOperacao {
  readonly tipo: 'id-de-operacao-vazio';
}

export function criarIdDeOperacao(
  texto: string,
): Result<IdDeOperacao, ErroDeIdDeOperacao> {
  const id = texto.trim();
  if (id === '') {
    return err({ tipo: 'id-de-operacao-vazio' });
  }
  return ok(id as IdDeOperacao);
}
// #endregion

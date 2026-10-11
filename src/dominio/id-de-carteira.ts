import type { Marcado } from './marca.js';
import { err, ok, type Result } from './resultado.js';

// #region id-de-carteira
export type IdDeCarteira = Marcado<string, 'IdDeCarteira'>;

export interface ErroDeIdDeCarteira {
  readonly tipo: 'id-de-carteira-vazio';
}

export function criarIdDeCarteira(
  texto: string,
): Result<IdDeCarteira, ErroDeIdDeCarteira> {
  const id = texto.trim();
  if (id === '') {
    return err({ tipo: 'id-de-carteira-vazio' });
  }
  return ok(id as IdDeCarteira);
}
// #endregion

import type { Marcado } from './marca.js';
import { err, ok, type Result } from './resultado.js';

// #region emissor
// A empresa que emite a ação e paga os seus proventos. PETR3 e PETR4
// são tickers diferentes da mesma empresa. O identificador legal é o
// CNPJ; o Lastro usa o nome que o catálogo lhe dá.
export type Emissor = Marcado<string, 'Emissor'>;

export interface ErroDeEmissor {
  readonly tipo: 'emissor-vazio';
}

export function criarEmissor(
  texto: string,
): Result<Emissor, ErroDeEmissor> {
  const emissor = texto.trim();
  if (emissor === '') {
    return err({ tipo: 'emissor-vazio' });
  }
  return ok(emissor as Emissor);
}
// #endregion

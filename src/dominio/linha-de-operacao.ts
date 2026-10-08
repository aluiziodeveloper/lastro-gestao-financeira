import type { ErroDeDataDePregao } from './data-de-pregao.js';
import type { ErroDeOperacao } from './erros.js';
import type { ErroDeIdDeOperacao } from './id-de-operacao.js';
import type { Operacao } from './operacao.js';
import type { ErroDeQuantidade } from './quantidade.js';
import type { Result } from './resultado.js';
import type { ErroDeTicker } from './ticker.js';

// #region linha-de-operacao
// Uma linha da importação, ainda sem validar. Preço e custos já chegam
// em centavos.
export interface LinhaDeOperacao {
  readonly id: string;
  readonly tipo: string;
  readonly data: string;
  readonly ticker: string;
  readonly quantidade: number;
  readonly precoEmCentavos: bigint;
  readonly custosEmCentavos: bigint;
}

export type ErroDeLinha =
  | ErroDeIdDeOperacao
  | {
      readonly tipo: 'tipo-de-operacao-desconhecido';
      readonly texto: string;
    }
  | ErroDeDataDePregao
  | ErroDeTicker
  | ErroDeQuantidade
  | ErroDeOperacao;
// #endregion

// Desafio do Capítulo 3: valide todos os campos da linha e devolva a
// operação ou a lista de todos os erros, na ordem dos campos. Os testes
// estão em test/dominio/linha-de-operacao.test.ts.
export function operacaoDeLinha(
  linha: LinhaDeOperacao,
): Result<Operacao, readonly ErroDeLinha[]> {
  throw new Error(`Desafio do Capítulo 3 não resolvido: '${linha.id}'`);
}

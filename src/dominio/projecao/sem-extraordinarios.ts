import type { MesDeApuracao } from '../apuracao/mes-de-apuracao.js';
import type { Carteira } from '../carteira.js';
import type { Provento } from '../proventos/provento.js';
import type { RendaProjetada } from './renda-projetada.js';

// A regra que separa um provento extraordinário dos outros: ele é
// extraordinário quando o seu valor por unidade passa de um múltiplo
// da mediana dos outros do mesmo ativo na janela.
export interface RegraDeExtraordinario {
  readonly multiploDaMediana: bigint;
}

export const maisDoDobroDaMediana: RegraDeExtraordinario = {
  multiploDaMediana: 2n,
};

/* eslint-disable @typescript-eslint/no-unused-vars -- esboço */
// #region sem-extraordinarios
// Desafio do Capítulo 12: a projeção sem os proventos extraordinários
// da janela. A comparação dos valores por unidade é por multiplicação
// cruzada, sem dividir. Os testes estão em
// test/dominio/sem-extraordinarios.test.ts.
export function projetarSemExtraordinarios(
  proventos: readonly Provento[],
  carteira: Carteira,
  mesCorrente: MesDeApuracao,
  regra: RegraDeExtraordinario,
): RendaProjetada {
  throw new Error('Desafio do Capítulo 12 não resolvido');
}
// #endregion
/* eslint-enable @typescript-eslint/no-unused-vars */

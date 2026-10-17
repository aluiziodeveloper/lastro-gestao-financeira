import type { RepositorioDeCarteiras } from '../../aplicacao/portas.js';

// #region repositorio-arquivo
// Desafio do Capítulo 14: um repositório que guarda as operações num
// arquivo JSON, um objeto com uma lista por carteira. O JSON não tem
// bigint; os centavos e a quantidade vão como texto. A suíte de
// contrato de test/contrato/arquivo.test.ts diz quando está pronto.
export function repositorioEmArquivo(
  caminho: string,
): RepositorioDeCarteiras {
  throw new Error(`Desafio do Capítulo 14: guarde em ${caminho}.`);
}
// #endregion

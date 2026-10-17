import type { IdDeCarteira } from '../dominio/id-de-carteira.js';
import type { Operacao } from '../dominio/operacao.js';

// #region porta-repositorio
// Onde as operações de cada carteira ficam guardadas. A porta tem os
// dois métodos de que os casos de uso precisam, e os dois devolvem
// Promise, porque um banco responde depois. Uma regra recusada é
// Result; uma falha do banco rejeita a Promise.
export interface RepositorioDeCarteiras {
  operacoesDe(id: IdDeCarteira): Promise<readonly Operacao[]>;
  acrescentar(
    id: IdDeCarteira,
    operacoes: readonly Operacao[],
  ): Promise<void>;
}
// #endregion

import type { RepositorioDeCarteiras } from '../../src/aplicacao/portas.js';
import type { Operacao } from '../../src/dominio/operacao.js';

// #region repositorio-de-teste
// Um repositório que guarda as operações num Map: o bastante para os
// testes dos casos de uso, sem banco. É um dublê do tipo fake: faz o
// trabalho de verdade, de um jeito simples.
export function repositorioDeTeste(): RepositorioDeCarteiras {
  const porCarteira = new Map<string, readonly Operacao[]>();
  return {
    operacoesDe: (id) => Promise.resolve(porCarteira.get(id) ?? []),
    acrescentar: (id, operacoes) => {
      porCarteira.set(id, [
        ...(porCarteira.get(id) ?? []),
        ...operacoes,
      ]);
      return Promise.resolve();
    },
  };
}
// #endregion

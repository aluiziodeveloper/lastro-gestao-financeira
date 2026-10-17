import type { RepositorioDeCarteiras } from '../../aplicacao/portas.js';
import type { Operacao } from '../../dominio/operacao.js';

// #region repositorio-memoria
// As operações de cada carteira num Map, que some quando o processo
// acaba. Serve aos testes dos casos de uso e a quem quer experimentar
// o Lastro sem banco. É um dublê do tipo fake: faz o trabalho de
// verdade, de um jeito simples, e passa na mesma suíte de contrato
// dos repositórios com banco.
export function repositorioEmMemoria(): RepositorioDeCarteiras {
  const porCarteira = new Map<string, readonly Operacao[]>();
  return {
    operacoesDe: (id) => Promise.resolve(porCarteira.get(id) ?? []),
    acrescentar: (id, operacoes) => {
      const anteriores = porCarteira.get(id) ?? [];
      porCarteira.set(id, [...anteriores, ...operacoes]);
      return Promise.resolve();
    },
  };
}
// #endregion

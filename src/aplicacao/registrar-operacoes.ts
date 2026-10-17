import type { Carteira } from '../dominio/carteira.js';
import type { ErroDeCarteira } from '../dominio/erros.js';
import { carteiraDoHistorico } from '../dominio/historico.js';
import type { IdDeCarteira } from '../dominio/id-de-carteira.js';
import type { IdDeOperacao } from '../dominio/id-de-operacao.js';
import type { Operacao } from '../dominio/operacao.js';
import { err, type Result } from '../dominio/resultado.js';
import type { RepositorioDeCarteiras } from './portas.js';

export type ErroDeRegistro =
  | ErroDeCarteira
  | { readonly tipo: 'operacao-repetida'; readonly id: IdDeOperacao };

// #region caso-de-uso-registrar
// O caso de uso não decide regra: lê o histórico, deixa a carteira
// aceitar ou recusar as operações novas e só grava se ela aceitou
// todas. Uma operação já registrada, com o mesmo identificador, é
// recusada: importar o mesmo arquivo duas vezes não dobra a posição.
export async function registrarOperacoes(
  repositorio: RepositorioDeCarteiras,
  id: IdDeCarteira,
  novas: readonly Operacao[],
): Promise<Result<Carteira, ErroDeRegistro>> {
  const anteriores = await repositorio.operacoesDe(id);
  const repetida = novas.find((nova) =>
    anteriores.some((anterior) => anterior.id === nova.id),
  );
  if (repetida !== undefined) {
    return err({ tipo: 'operacao-repetida', id: repetida.id });
  }
  const carteira = carteiraDoHistorico(id, [...anteriores, ...novas]);
  if (carteira.ok) {
    await repositorio.acrescentar(id, novas);
  }
  return carteira;
}
// #endregion

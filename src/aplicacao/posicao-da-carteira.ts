import type { Carteira } from '../dominio/carteira.js';
import type { ErroDeCarteira } from '../dominio/erros.js';
import { carteiraDoHistorico } from '../dominio/historico.js';
import type { IdDeCarteira } from '../dominio/id-de-carteira.js';
import type { Result } from '../dominio/resultado.js';
import type { RepositorioDeCarteiras } from './portas.js';

// A carteira como está hoje, reconstituída das operações guardadas.
export async function posicaoDaCarteira(
  repositorio: RepositorioDeCarteiras,
  id: IdDeCarteira,
): Promise<Result<Carteira, ErroDeCarteira>> {
  return carteiraDoHistorico(id, await repositorio.operacoesDe(id));
}

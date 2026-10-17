import type { ErroDeApuracao } from '../dominio/apuracao/apuracao-do-mes.js';
import { apurarMeses } from '../dominio/apuracao/apuracao-dos-meses.js';
import { estadoInicial } from '../dominio/apuracao/estado-da-apuracao.js';
import type { MesDeApuracao } from '../dominio/apuracao/mes-de-apuracao.js';
import { Carteira } from '../dominio/carteira.js';
import type { DadosDeReferencia } from '../dominio/dados-de-referencia.js';
import { movimentosAte } from '../dominio/historico.js';
import type { IdDeCarteira } from '../dominio/id-de-carteira.js';
import { relatorioDoMes } from '../dominio/relatorio/relatorio.js';
import { ok, type Result } from '../dominio/resultado.js';
import type { RepositorioDeCarteiras } from './portas.js';

// #region caso-de-uso-relatorio
// O relatório de um mês: apura do primeiro mês com operação até ele,
// porque o prejuízo e o DARF pendente vêm dos meses anteriores, e
// devolve as linhas do último.
export async function relatorioDoMesDaCarteira(
  repositorio: RepositorioDeCarteiras,
  referencias: DadosDeReferencia,
  id: IdDeCarteira,
  mes: MesDeApuracao,
): Promise<Result<readonly string[], ErroDeApuracao>> {
  const operacoes = await repositorio.operacoesDe(id);
  const apuracao = apurarMeses(
    movimentosAte(operacoes, mes),
    estadoInicial(Carteira.abrir(id)),
    referencias,
  );
  if (!apuracao.ok) {
    return apuracao;
  }
  return ok(apuracao.valor.apuracoes.slice(-1).flatMap(relatorioDoMes));
}
// #endregion

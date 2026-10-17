import type { MovimentoDoMes } from './apuracao/apuracao-do-mes.js';
import { MesDeApuracao } from './apuracao/mes-de-apuracao.js';
import { Carteira } from './carteira.js';
import type { ErroDeCarteira } from './erros.js';
import type { IdDeCarteira } from './id-de-carteira.js';
import type { Operacao } from './operacao.js';
import { ok, type Result } from './resultado.js';

// #region historico
// A carteira a partir das suas operações, registradas de novo, em
// ordem: as verificações de quando entraram valem outra vez, e uma
// operação que a carteira recusaria não passa.
export function carteiraDoHistorico(
  id: IdDeCarteira,
  operacoes: readonly Operacao[],
): Result<Carteira, ErroDeCarteira> {
  return operacoes.reduce<Result<Carteira, ErroDeCarteira>>(
    (atual, operacao) =>
      atual.ok ? atual.valor.registrar(operacao) : atual,
    ok(Carteira.abrir(id)),
  );
}

// Os movimentos do primeiro mês com operação até o mês pedido, um por
// mês, com os vazios no meio: a dobra do Capítulo 11 exige meses
// seguidos. Sem operação até lá, o próprio mês, vazio.
export function movimentosAte(
  operacoes: readonly Operacao[],
  mes: MesDeApuracao,
): readonly MovimentoDoMes[] {
  const primeira = operacoes[0];
  const inicio =
    primeira === undefined ? mes : MesDeApuracao.doDia(primeira.data);
  const meses = inicio.mesesAte(mes);
  return (meses.length > 0 ? meses : [mes]).map((doMes) => ({
    mes: doMes,
    operacoes: operacoes.filter(({ data }) => doMes.contem(data)),
    retencoes: [],
  }));
}
// #endregion

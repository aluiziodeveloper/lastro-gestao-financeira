import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import { PrejuizoAcumulado } from '../prejuizo/prejuizo-acumulado.js';
import { err, ok, type Result } from '../resultado.js';
import type { MesDeApuracao } from './mes-de-apuracao.js';

// #region estado-da-apuracao
// O que um mês entrega ao seguinte: o último mês apurado, a carteira,
// o prejuízo e o imposto retido a compensar. O estado é um valor: cada
// mês devolve um estado novo, e o do mês anterior continua o mesmo.
export interface EstadoDaApuracao {
  readonly apuradoAte?: MesDeApuracao;
  readonly carteira: Carteira;
  readonly prejuizo: PrejuizoAcumulado;
  readonly irrf: Dinheiro;
}

// Antes do primeiro mês, nenhum mês foi apurado e não há prejuízo nem
// imposto retido a compensar.
export function estadoInicial(carteira: Carteira): EstadoDaApuracao {
  return {
    carteira,
    prejuizo: PrejuizoAcumulado.nenhum(),
    irrf: Dinheiro.deCentavos(0n),
  };
}

export interface ErroDeSequencia {
  readonly tipo: 'meses-fora-de-sequencia';
  readonly apuradoAte: MesDeApuracao;
  readonly mes: MesDeApuracao;
}

// O estado só serve ao mês seguinte ao último apurado. Um mês repetido,
// fora de ordem ou depois de uma lacuna é recusado: o prejuízo de um
// mês pulado nunca entraria no saldo.
export function conferirSequencia(
  mes: MesDeApuracao,
  { apuradoAte }: EstadoDaApuracao,
): Result<MesDeApuracao, ErroDeSequencia> {
  if (apuradoAte === undefined || mes.ehSeguinteDe(apuradoAte)) {
    return ok(mes);
  }
  return err({ tipo: 'meses-fora-de-sequencia', apuradoAte, mes });
}
// #endregion

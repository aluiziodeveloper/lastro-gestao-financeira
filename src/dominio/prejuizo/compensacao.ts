import type {
  NomeDaCategoria,
  ResultadoDaCategoria,
} from '../apuracao/apuracao-do-mes.js';
import { Dinheiro } from '../dinheiro.js';
import {
  grupoDaCategoria,
  type PrejuizoAcumulado,
} from './prejuizo-acumulado.js';

// #region compensacao
// A base tributável de uma categoria: o ganho do mês menos o prejuízo
// que o grupo dela compensou.
export interface BaseDaCategoria {
  readonly categoria: NomeDaCategoria;
  readonly compensado: Dinheiro;
  readonly base: Dinheiro;
}

export interface Compensacao {
  readonly bases: readonly BaseDaCategoria[];
  readonly prejuizo: PrejuizoAcumulado;
}

// As perdas do mês entram no saldo do grupo antes dos ganhos, inclusive
// as de um mês isento (IN RFB 1.585/2015, art. 59, § 1º). Depois, cada
// ganho tributável abate o saldo do próprio grupo, na ordem das
// categorias: no grupo comum, ações e então ETF.
export function compensar(
  resultados: readonly ResultadoDaCategoria[],
  anterior: PrejuizoAcumulado,
): Compensacao {
  const comAsPerdas = resultados.reduce(
    (prejuizo, { categoria, resultado }) =>
      prejuizo.acumular(grupoDaCategoria[categoria], resultado),
    anterior,
  );
  return resultados.reduce(abaterGanho, {
    bases: [],
    prejuizo: comAsPerdas,
  });
}

const zero = Dinheiro.deCentavos(0n);

// O ganho isento não consome prejuízo: não há imposto a reduzir.
function abaterGanho(
  { bases, prejuizo }: Compensacao,
  { categoria, resultado, isenta }: ResultadoDaCategoria,
): Compensacao {
  const ganho = isenta || !resultado.ehPositivo() ? zero : resultado;
  const { compensado, prejuizo: seguinte } = prejuizo.compensar(
    grupoDaCategoria[categoria],
    ganho,
  );
  const base = ganho.subtrair(compensado);
  return {
    bases: [...bases, { categoria, compensado, base }],
    prejuizo: seguinte,
  };
}
// #endregion

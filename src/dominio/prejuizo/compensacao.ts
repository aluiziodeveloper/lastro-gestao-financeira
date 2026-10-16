import type {
  ResultadoDaCategoria,
  Totais,
} from '../apuracao/apuracao-do-mes.js';
import type { CategoriaDeApuracao } from '../apuracao/categoria.js';
import { type Lancamento, totaisDe } from '../apuracao/lancamentos.js';
import {
  grupoDaCategoria,
  type PrejuizoAcumulado,
} from './prejuizo-acumulado.js';

// #region compensacao
// As categorias do mês, apuradas, e o prejuízo que fica para o mês
// seguinte.
export interface Compensacao {
  readonly categorias: readonly ResultadoDaCategoria[];
  readonly prejuizo: PrejuizoAcumulado;
}

// As perdas do mês entram no saldo do grupo antes dos ganhos,
// inclusive as de um mês isento (IN RFB 1.585/2015, art. 59, § 1º).
// Depois, cada categoria apura com o saldo do próprio grupo, na ordem
// das categorias: no grupo comum, ações e então ETF.
export function compensar(
  categorias: readonly CategoriaDeApuracao[],
  lancamentos: readonly Lancamento[],
  anterior: PrejuizoAcumulado,
): Compensacao {
  const doMes = categorias.map((categoria) => ({
    categoria,
    totais: totaisDe(categoria.nome, lancamentos),
  }));
  const comAsPerdas = doMes.reduce(
    (prejuizo, { categoria, totais }) =>
      prejuizo.acumular(
        grupoDaCategoria[categoria.nome],
        totais.resultado,
      ),
    anterior,
  );
  return doMes.reduce(apurarComOSaldo, {
    categorias: [],
    prejuizo: comAsPerdas,
  });
}

interface CategoriaDoMes {
  readonly categoria: CategoriaDeApuracao;
  readonly totais: Totais;
}

function apurarComOSaldo(
  { categorias, prejuizo }: Compensacao,
  { categoria, totais }: CategoriaDoMes,
): Compensacao {
  const { apurado, prejuizo: seguinte } = categoria.apurar(
    totais,
    prejuizo,
  );
  return { categorias: [...categorias, apurado], prejuizo: seguinte };
}
// #endregion

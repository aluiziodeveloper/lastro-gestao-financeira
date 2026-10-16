import { Dinheiro } from '../dinheiro.js';
import {
  type GrupoDeCompensacao,
  grupoDaCategoria,
  type PrejuizoAcumulado,
} from '../prejuizo/prejuizo-acumulado.js';
import type { ApuracaoDoMes } from './apuracao-do-mes.js';
import type { MesDeApuracao } from './mes-de-apuracao.js';

// As colunas de um grupo num mês, como o Demonstrativo de Apuração de
// Ganhos da declaração as pede: o resultado do mês, o prejuízo até o
// mês anterior, a base de cálculo e o prejuízo que fica a compensar.
export interface GrupoNoMes {
  readonly resultado: Dinheiro;
  readonly anterior: Dinheiro;
  readonly base: Dinheiro;
  readonly aCompensar: Dinheiro;
}

export interface LinhaDoDemonstrativo {
  readonly mes: MesDeApuracao;
  readonly grupos: Readonly<Record<GrupoDeCompensacao, GrupoNoMes>>;
}

// #region demonstrativo
// Desafio do Capítulo 11: o demonstrativo do ano, mês a mês, a partir
// das apurações e do prejuízo que vem do ano anterior (Perguntas e
// Respostas IRPF 2026, pergunta 711). É a dobra da Seção 8: o prejuízo
// a compensar de um mês é o anterior do mês seguinte.
export function demonstrativoDoAno(
  apuracoes: readonly ApuracaoDoMes[],
  doAnoAnterior: PrejuizoAcumulado,
): readonly LinhaDoDemonstrativo[] {
  const inicio: Andamento = { linhas: [], anterior: doAnoAnterior };
  return apuracoes.reduce(proximaLinha, inicio).linhas;
}

interface Andamento {
  readonly linhas: readonly LinhaDoDemonstrativo[];
  readonly anterior: PrejuizoAcumulado;
}

function proximaLinha(
  { linhas, anterior }: Andamento,
  apuracao: ApuracaoDoMes,
): Andamento {
  const colunas = (grupo: GrupoDeCompensacao) =>
    colunasDoGrupo(grupo, apuracao, anterior);
  const grupos = {
    comum: colunas('comum'),
    'day-trade': colunas('day-trade'),
    fii: colunas('fii'),
  };
  const { mes, estado } = apuracao;
  return {
    linhas: [...linhas, { mes, grupos }],
    anterior: estado.prejuizo,
  };
}

// As categorias do grupo somadas; o anterior vem da linha de antes, e
// o que fica a compensar, do estado do mês.
function colunasDoGrupo(
  grupo: GrupoDeCompensacao,
  { categorias, estado }: ApuracaoDoMes,
  anterior: PrejuizoAcumulado,
): GrupoNoMes {
  const doGrupo = categorias.filter(
    ({ categoria }) => grupoDaCategoria[categoria] === grupo,
  );
  return {
    resultado: somar(doGrupo.map(({ resultado }) => resultado)),
    anterior: anterior.saldoDe(grupo),
    base: somar(doGrupo.map(({ base }) => base)),
    aCompensar: estado.prejuizo.saldoDe(grupo),
  };
}
// #endregion

function somar(valores: readonly Dinheiro[]): Dinheiro {
  return valores.reduce(
    (total, valor) => total.somar(valor),
    Dinheiro.deCentavos(0n),
  );
}

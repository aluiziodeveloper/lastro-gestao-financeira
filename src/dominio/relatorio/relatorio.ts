import type {
  ApuracaoDoMes,
  NomeDaCategoria,
  ResultadoDaCategoria,
} from '../apuracao/apuracao-do-mes.js';
import type { MesDeApuracao } from '../apuracao/mes-de-apuracao.js';
import type { DataDoCalendario } from '../data-do-calendario.js';
import { type Recolhimento, valorMinimoDoDarf } from '../darf/darf.js';
import { garantirExaustividade } from '../exaustividade.js';
import type { DeducaoDoIrrf } from '../irrf/imposto-retido.js';
import type {
  GrupoDeCompensacao,
  PrejuizoAcumulado,
} from '../prejuizo/prejuizo-acumulado.js';

// #region relatorio-mensal
// O relatório “quanto pagar” de um mês, linha a linha. É uma função
// pura: recebe a apuração e devolve texto, sem imprimir nada. Quem
// chama decide se o texto vai à tela, a um arquivo ou a um teste.
export function relatorioDoMes(
  apuracao: ApuracaoDoMes,
): readonly string[] {
  return [
    `Apuração de ${mesEAno(apuracao.mes)}`,
    ...apuracao.categorias.filter(teveVendas).map(linhaDaCategoria),
    linhaDoPrejuizo(apuracao.estado.prejuizo),
    `Imposto do mês: ${apuracao.imposto.emReais()}`,
    ...linhasDoIrrf(apuracao.irrf),
    linhaDoRecolhimento(apuracao.recolhimento),
  ];
}

function linhaDoRecolhimento(recolhimento: Recolhimento): string {
  switch (recolhimento.tipo) {
    case 'darf': {
      const { codigo, valor, vencimento } = recolhimento.darf;
      const prazo = diaMesEAno(vencimento);
      return `DARF ${codigo}: ${valor.emReais()}, vencimento ${prazo}`;
    }
    case 'abaixo-do-minimo':
      return (
        `Abaixo do mínimo de ${valorMinimoDoDarf.emReais()}: ` +
        `${recolhimento.acumulado.emReais()} passam ao mês seguinte`
      );
    case 'sem-imposto':
      return 'Nada a recolher';
    default:
      return garantirExaustividade(recolhimento);
  }
}
// #endregion

const nomeDaCategoria: Readonly<Record<NomeDaCategoria, string>> = {
  'acoes-comum': 'Ações (operação comum)',
  'day-trade': 'Day trade',
  fii: 'FII',
  etf: 'ETF',
};

const nomeDoGrupo: Readonly<Record<GrupoDeCompensacao, string>> = {
  comum: 'comum',
  'day-trade': 'day trade',
  fii: 'FII',
};

const grupos: readonly GrupoDeCompensacao[] = [
  'comum',
  'day-trade',
  'fii',
];

function teveVendas({ totalVendido }: ResultadoDaCategoria): boolean {
  return totalVendido.ehPositivo();
}

function linhaDaCategoria(apurado: ResultadoDaCategoria): string {
  const { categoria, resultado, compensado, imposto, isenta } = apurado;
  const isencao = isenta ? ' (isento)' : '';
  return (
    `${nomeDaCategoria[categoria]}${isencao}: ` +
    `resultado ${resultado.emReais()}; ` +
    `compensado ${compensado.emReais()}; imposto ${imposto.emReais()}`
  );
}

function linhaDoPrejuizo(prejuizo: PrejuizoAcumulado): string {
  const saldos = grupos.map(
    (grupo) =>
      `${nomeDoGrupo[grupo]} ${prejuizo.saldoDe(grupo).emReais()}`,
  );
  return `Prejuízo a compensar: ${saldos.join('; ')}`;
}

// O saldo encerrado só aparece no mês em que se encerra, em dezembro.
function linhasDoIrrf(irrf: DeducaoDoIrrf): readonly string[] {
  const { retido, deduzido, saldo, encerrado } = irrf;
  const linha =
    `IRRF: retido ${retido.emReais()}; deduzido ${deduzido.emReais()}; ` +
    `saldo ${saldo.emReais()}`;
  if (!encerrado.ehPositivo()) {
    return [linha];
  }
  return [
    linha,
    `IRRF encerrado no fim do ano: ${encerrado.emReais()}`,
  ];
}

function mesEAno(mes: MesDeApuracao): string {
  const dia = mes.primeiroDia();
  return `${dia.slice(5, 7)}/${dia.slice(0, 4)}`;
}

function diaMesEAno(data: DataDoCalendario): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}

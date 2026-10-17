import type { ClasseDeAtivo } from '../classe-de-ativo.js';
import { garantirExaustividade } from '../exaustividade.js';
import type { RegrasDeApuracao } from '../regime/regime-tributario.js';
import type { NomeDaCategoria } from './apuracao-do-mes.js';
import {
  categoria,
  type CategoriaDeApuracao,
  isencaoAte,
  semIsencao,
} from './categoria.js';

const nomesDasCategorias: readonly NomeDaCategoria[] = [
  'acoes-comum',
  'day-trade',
  'fii',
  'etf',
];

// #region categorias
// As quatro categorias do mês, montadas com as mesmas peças a partir
// das regras do regime vigente: a alíquota e, quando há, o limite de
// isenção. Nenhum valor da lei mora aqui.
export function categoriasDo(
  regras: RegrasDeApuracao,
): readonly CategoriaDeApuracao[] {
  return nomesDasCategorias.map((nome) => {
    const { aliquota, isencaoAte: limite } = regras[nome];
    const isencao =
      limite === undefined ? semIsencao : isencaoAte(limite);
    return categoria(nome, aliquota, isencao);
  });
}
// #endregion

// #region categoria-da-classe
// Uma venda comum vai para a categoria da classe do ativo. O switch
// fica: ele traduz uma união fechada, e a exaustividade avisa quando
// uma classe nova chegar sem categoria.
export function categoriaComum(classe: ClasseDeAtivo): NomeDaCategoria {
  switch (classe) {
    case 'acao':
      return 'acoes-comum';
    case 'fii':
      return 'fii';
    case 'etf':
      return 'etf';
    default:
      return garantirExaustividade(classe);
  }
}
// #endregion

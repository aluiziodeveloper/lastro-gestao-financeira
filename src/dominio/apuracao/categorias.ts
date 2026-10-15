import { Aliquota } from '../aliquota.js';
import type { ClasseDeAtivo } from '../ativo.js';
import { Dinheiro } from '../dinheiro.js';
import { garantirExaustividade } from '../exaustividade.js';
import type { NomeDaCategoria } from './apuracao-do-mes.js';
import {
  categoria,
  type CategoriaDeApuracao,
  isencaoAte,
  semIsencao,
} from './categoria.js';

const quinzePorCento = Aliquota.de(15n, 100n);
const vintePorCento = Aliquota.de(20n, 100n);

// #region isencao-mensal
// Ações em operação comum: se o total vendido no mês não passa de
// R$ 20.000,00, o ganho do mês inteiro é isento; passou um centavo, o
// ganho inteiro é tributável (Lei 11.033/2004, art. 3º, I).
export const limiteDeIsencao = Dinheiro.deCentavos(20_000_00n);
// #endregion

// #region categorias
// As quatro categorias do mês, montadas com as mesmas peças (IN RFB
// 1.585/2015, arts. 37, 57, 59 e 65). Uma categoria nova é um item a
// mais nesta lista, e a apuração não muda.
export const categoriasDoMes: readonly CategoriaDeApuracao[] = [
  categoria('acoes-comum', quinzePorCento, isencaoAte(limiteDeIsencao)),
  categoria('day-trade', vintePorCento, semIsencao),
  categoria('fii', vintePorCento, semIsencao),
  categoria('etf', quinzePorCento, semIsencao),
];
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

import type { AlocacaoAlvo } from '../alocacao/alocacao-alvo.js';
import type { Composicao } from '../alocacao/composicao.js';
import { investirOCaixa } from './aportes.js';
import {
  compor,
  quando,
  type Recursos,
  type Representantes,
} from './politica.js';
import { vendasInteiras } from './quantidades.js';
import { propostaVazia, type Sugestao } from './sugestao.js';
import { acoesAcimaDaBanda, venderAcoesNaMargem } from './vendas.js';

// #region politica-do-lastro
// O rebalanceamento do Lastro, política a política: vender ações só
// quando estão acima da banda, em ações inteiras; depois, investir o
// aporte e o dinheiro das vendas, também em unidades inteiras.
export const politicaDoLastro = compor(
  quando(acoesAcimaDaBanda, venderAcoesNaMargem),
  vendasInteiras,
  investirOCaixa,
);

export function rebalancear(
  composicao: Composicao,
  alocacao: AlocacaoAlvo,
  recursos: Recursos,
  representantes: Representantes,
): Sugestao {
  return politicaDoLastro(
    { composicao, alocacao, recursos, representantes },
    propostaVazia,
  );
}
// #endregion

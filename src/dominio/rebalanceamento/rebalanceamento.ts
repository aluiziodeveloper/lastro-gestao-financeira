import type { AlocacaoAlvo } from '../alocacao/alocacao-alvo.js';
import type { Composicao } from '../alocacao/composicao.js';
import { investirOCaixa } from './aportes.js';
import { compor, quando, type Recursos } from './politica.js';
import { propostaVazia, type Sugestao } from './sugestao.js';
import { acoesAcimaDaBanda, venderAcoesNaMargem } from './vendas.js';

// #region politica-do-lastro
// O rebalanceamento do Lastro, política a política: vender ações só
// quando estão acima da banda; depois, investir o aporte e o dinheiro
// das vendas.
export const politicaDoLastro = compor(
  quando(acoesAcimaDaBanda, venderAcoesNaMargem),
  investirOCaixa,
);

export function rebalancear(
  composicao: Composicao,
  alocacao: AlocacaoAlvo,
  recursos: Recursos,
): Sugestao {
  return politicaDoLastro(
    { composicao, alocacao, recursos },
    propostaVazia,
  );
}
// #endregion

import type { AlocacaoAlvo } from '../alocacao/alocacao-alvo.js';
import type { Composicao } from '../alocacao/composicao.js';
import type { ClasseDeAtivo } from '../classe-de-ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import {
  cemPorCento,
  type PontosBase,
} from '../mercado/pontos-base.js';
import { investirOCaixa } from './aportes.js';
import {
  compor,
  type PoliticaDeRebalanceamento,
  quando,
  type Recursos,
  type Representantes,
} from './politica.js';
import { vendasInteiras } from './quantidades.js';
import {
  type Ordem,
  propostaVazia,
  type Sugestao,
} from './sugestao.js';
import { acoesAcimaDaBanda, venderAcoesNaMargem } from './vendas.js';

// O custo de executar uma ordem, fixo, e o limite que ele pode ter em
// relação ao valor da ordem, em pontos-base.
export interface CustoOperacional {
  readonly porOrdem: Dinheiro;
  readonly limite: PontosBase;
}

// #region custo-operacional
// Desafio do Capítulo 13: uma política que descarta as ordens cujo
// custo passa do limite, composta às do Lastro sem mudá-las. A ordem
// vale o custo quando custo ÷ valor não passa de limite ÷ 10.000: pela
// multiplicação cruzada, custo × 10.000 não passa de limite × valor.
export function semOrdensCaras(
  custo: CustoOperacional,
): PoliticaDeRebalanceamento {
  const valeOCusto = ({ valor }: Ordem): boolean =>
    !custo.porOrdem
      .multiplicarPorUnidades(cemPorCento)
      .excede(valor.multiplicarPorUnidades(custo.limite));
  return ({ representantes }, proposta) =>
    proposta.ordens
      .filter((ordem) => !valeOCusto(ordem))
      .reduce(
        (atual, ordem) => semAOrdem(atual, ordem, representantes),
        proposta,
      );
}

// A ordem sai com o seu valor, na classe do representante: a venda
// deixa de existir, e a compra devolve o dinheiro ao caixa.
function semAOrdem(
  proposta: Sugestao,
  ordem: Ordem,
  representantes: Representantes,
): Sugestao {
  const lado = ordem.tipo === 'compra' ? 'compras' : 'vendas';
  const menos = (classe: ClasseDeAtivo): Dinheiro =>
    representantes[classe]?.ticker.equivaleA(ordem.ticker) === true
      ? proposta[lado][classe].subtrair(ordem.valor)
      : proposta[lado][classe];
  const caixa =
    lado === 'compras'
      ? proposta.caixa.somar(ordem.valor)
      : proposta.caixa;
  return {
    ...proposta,
    [lado]: {
      acao: menos('acao'),
      fii: menos('fii'),
      etf: menos('etf'),
    },
    caixa,
    ordens: proposta.ordens.filter((outra) => outra !== ordem),
  };
}

// A venda cara sai antes de investir, para não financiar compras; a
// compra cara sai depois, e o dinheiro dela fica em caixa.
export function rebalancearComCusto(
  composicao: Composicao,
  alocacao: AlocacaoAlvo,
  recursos: Recursos,
  representantes: Representantes,
  custo: CustoOperacional,
): Sugestao {
  const politica = compor(
    quando(acoesAcimaDaBanda, venderAcoesNaMargem),
    vendasInteiras,
    semOrdensCaras(custo),
    investirOCaixa,
    semOrdensCaras(custo),
  );
  return politica(
    { composicao, alocacao, recursos, representantes },
    propostaVazia,
  );
}
// #endregion

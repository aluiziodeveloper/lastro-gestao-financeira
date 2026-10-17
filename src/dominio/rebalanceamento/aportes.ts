import type { AlocacaoAlvo } from '../alocacao/alocacao-alvo.js';
import type { Composicao } from '../alocacao/composicao.js';
import type { ModoDeArredondamento } from '../arredondamento.js';
import {
  type ClasseDeAtivo,
  classesDeAtivo,
} from '../classe-de-ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import { cemPorCento } from '../mercado/pontos-base.js';
import type {
  PoliticaDeRebalanceamento,
  Representantes,
} from './politica.js';
import { comOrdem, ordemDe } from './quantidades.js';
import {
  depoisDasVendas,
  propostaVazia,
  type Sugestao,
  totalDe,
} from './sugestao.js';

// #region por-aporte
// O valor-alvo de uma classe trunca o centavo: a compra nunca passa do
// alvo, e o centavo que sobra fica em caixa.
export const arredondamentoDoAlvo: ModoDeArredondamento = 'truncar';

interface Falta {
  readonly classe: ClasseDeAtivo;
  readonly falta: Dinheiro;
}

// Heurística gulosa: o aporte vai às classes abaixo do alvo, a de
// maior falta primeiro, cada uma até o seu alvo calculado sobre o
// total com o aporte, em unidades inteiras do representante. O que
// não forma uma unidade passa à classe seguinte, e o que sobra no fim
// fica em caixa. Comprar não gera imposto, e nada se vende.
export function porAporte(
  composicao: Composicao,
  alocacao: AlocacaoAlvo,
  aporte: Dinheiro,
  representantes: Representantes,
): Sugestao {
  const total = composicao.total.somar(aporte);
  return classesDeAtivo
    .map((classe) => faltaDe(classe, composicao, alocacao, total))
    .toSorted(maiorFaltaPrimeiro)
    .reduce((atual, falta) => comprar(atual, falta, representantes), {
      ...propostaVazia,
      caixa: aporte,
    });
}

// Uma classe recebe até a sua falta, do que ainda há em caixa. A que
// está no alvo ou acima dele, ou que chega com o caixa vazio, não
// compra.
function comprar(
  atual: Sugestao,
  { classe, falta }: Falta,
  representantes: Representantes,
): Sugestao {
  const valor = falta.excede(atual.caixa) ? atual.caixa : falta;
  const representante = representantes[classe];
  if (!valor.ehPositivo()) {
    return atual;
  }
  if (representante === undefined) {
    const semRepresentante = [...atual.semRepresentante, classe];
    return { ...atual, semRepresentante };
  }
  const ordem = ordemDe('compra', valor, representante);
  const comprado = comOrdem(atual, 'compras', classe, ordem);
  return { ...comprado, caixa: atual.caixa.subtrair(ordem.valor) };
}

function faltaDe(
  classe: ClasseDeAtivo,
  { porClasse }: Composicao,
  alocacao: AlocacaoAlvo,
  total: Dinheiro,
): Falta {
  const alvo = total.multiplicarPorFracao(
    alocacao.fatiaDe(classe).alvo,
    cemPorCento,
    arredondamentoDoAlvo,
  );
  return { classe, falta: alvo.subtrair(porClasse[classe]) };
}

// Sem ramo, como o comparador do desafio do Capítulo 12.
function maiorFaltaPrimeiro(uma: Falta, outra: Falta): number {
  return (
    Number(outra.falta.excede(uma.falta)) -
    Number(uma.falta.excede(outra.falta))
  );
}
// #endregion

// #region investir-o-caixa
// Política: o aporte e o dinheiro das vendas da proposta vão às
// classes abaixo do alvo, pela heurística de porAporte.
export const investirOCaixa: PoliticaDeRebalanceamento = (
  { composicao, alocacao, recursos, representantes },
  proposta,
) => {
  const vendido = totalDe(proposta.vendas);
  const compras = porAporte(
    depoisDasVendas(composicao, proposta.vendas),
    alocacao,
    recursos.aporte.somar(vendido),
    representantes,
  );
  return {
    ...proposta,
    compras: compras.compras,
    caixa: compras.caixa,
    ordens: [...proposta.ordens, ...compras.ordens],
    semRepresentante: [
      ...proposta.semRepresentante,
      ...compras.semRepresentante,
    ],
  };
};
// #endregion

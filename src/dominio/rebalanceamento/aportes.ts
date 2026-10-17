import type { AlocacaoAlvo } from '../alocacao/alocacao-alvo.js';
import type { Composicao } from '../alocacao/composicao.js';
import type { ModoDeArredondamento } from '../arredondamento.js';
import {
  type ClasseDeAtivo,
  classesDeAtivo,
} from '../classe-de-ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import { cemPorCento } from '../mercado/pontos-base.js';
import { nenhumValor, type Sugestao } from './sugestao.js';

// #region por-aporte
// O valor-alvo de uma classe trunca o centavo: a compra nunca passa do
// alvo, e o centavo que sobra fica em caixa.
const arredondamentoDoAlvo: ModoDeArredondamento = 'truncar';

interface Falta {
  readonly classe: ClasseDeAtivo;
  readonly falta: Dinheiro;
}

// Heurística gulosa: o aporte vai às classes abaixo do alvo, a de
// maior falta primeiro, cada uma até o seu alvo calculado sobre o
// total com o aporte. Comprar não gera imposto, e nada se vende.
export function porAporte(
  composicao: Composicao,
  alocacao: AlocacaoAlvo,
  aporte: Dinheiro,
): Sugestao {
  const total = composicao.total.somar(aporte);
  const faltas = classesDeAtivo
    .map((classe) => faltaDe(classe, composicao, alocacao, total))
    .filter(({ falta }) => falta.ehPositivo())
    .toSorted(maiorFaltaPrimeiro);
  const { compras, restante } = faltas.reduce(
    (atual, { classe, falta }) => {
      const valor = falta.excede(atual.restante)
        ? atual.restante
        : falta;
      return {
        compras: { ...atual.compras, [classe]: valor },
        restante: atual.restante.subtrair(valor),
      };
    },
    { compras: nenhumValor, restante: aporte },
  );
  return { compras, vendas: nenhumValor, caixa: restante };
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

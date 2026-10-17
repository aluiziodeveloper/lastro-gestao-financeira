import {
  type ClasseDeAtivo,
  classesDeAtivo,
} from '../classe-de-ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import type { Cotacao } from '../mercado/cotacoes.js';
import type { PoliticaDeRebalanceamento } from './politica.js';
import { nenhumValor, type Ordem, type Sugestao } from './sugestao.js';

// #region quantidades-inteiras
// Unidades inteiras do representante, para baixo: a venda nunca passa
// da margem, e a compra nunca passa do dinheiro que há.
export function ordemDe(
  tipo: Ordem['tipo'],
  valor: Dinheiro,
  { ticker, preco }: Cotacao,
): Ordem {
  const quantidade = valor.razaoSobre(preco, 1n, 'truncar');
  const inteiro = preco.multiplicarPorUnidades(quantidade);
  return { tipo, ticker, quantidade, valor: inteiro };
}

// A ordem entra na proposta; a de zero unidades só zera o valor.
export function comOrdem(
  proposta: Sugestao,
  lado: 'compras' | 'vendas',
  classe: ClasseDeAtivo,
  ordem: Ordem,
): Sugestao {
  return {
    ...proposta,
    [lado]: { ...proposta[lado], [classe]: ordem.valor },
    ordens:
      ordem.quantidade > 0n
        ? [...proposta.ordens, ordem]
        : proposta.ordens,
  };
}

// Política: as vendas viram ações inteiras antes de investir, para
// que as compras usem o que a venda inteira rende. Sem representante,
// a classe não vende.
export const vendasInteiras: PoliticaDeRebalanceamento = (
  { representantes },
  proposta,
) =>
  classesDeAtivo
    .filter((classe) => proposta.vendas[classe].ehPositivo())
    .reduce(
      (atual, classe) => {
        const representante = representantes[classe];
        if (representante === undefined) {
          const semRepresentante = [...atual.semRepresentante, classe];
          return { ...atual, semRepresentante };
        }
        const valor = proposta.vendas[classe];
        const ordem = ordemDe('venda', valor, representante);
        return comOrdem(atual, 'vendas', classe, ordem);
      },
      { ...proposta, vendas: nenhumValor },
    );
// #endregion

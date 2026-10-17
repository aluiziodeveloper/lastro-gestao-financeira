import {
  type ClasseDeAtivo,
  classesDeAtivo,
} from '../classe-de-ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import type { Cotacao } from '../mercado/cotacoes.js';
import type {
  PoliticaDeRebalanceamento,
  Representantes,
} from './politica.js';
import {
  nenhumValor,
  type Ordem,
  totalDe,
  type ValoresPorClasse,
} from './sugestao.js';

// #region quantidades-inteiras
interface EmOrdens {
  readonly valores: ValoresPorClasse;
  readonly ordens: readonly Ordem[];
  readonly semRepresentante: readonly ClasseDeAtivo[];
}

// Cada valor vira unidades inteiras do representante da classe, para
// baixo: a venda nunca passa da margem, e a compra nunca passa do
// caixa. Sem representante, a classe não tem ordem.
function emOrdens(
  tipo: Ordem['tipo'],
  valores: ValoresPorClasse,
  representantes: Representantes,
): EmOrdens {
  const inicio: EmOrdens = {
    valores: nenhumValor,
    ordens: [],
    semRepresentante: [],
  };
  return classesDeAtivo
    .filter((classe) => valores[classe].ehPositivo())
    .reduce((atual, classe) => {
      const representante = representantes[classe];
      if (representante === undefined) {
        const semRepresentante = [...atual.semRepresentante, classe];
        return { ...atual, semRepresentante };
      }
      const ordem = ordemDe(tipo, valores[classe], representante);
      return comOrdem(atual, classe, ordem);
    }, inicio);
}

function ordemDe(
  tipo: Ordem['tipo'],
  valor: Dinheiro,
  { ticker, preco }: Cotacao,
): Ordem {
  const quantidade = unidadesEm(valor, preco);
  const inteiro = preco.multiplicarPorUnidades(quantidade);
  return { tipo, ticker, quantidade, valor: inteiro };
}

// Uma ordem de zero unidades não entra na lista, mas zera o valor.
function comOrdem(
  atual: EmOrdens,
  classe: ClasseDeAtivo,
  ordem: Ordem,
): EmOrdens {
  return {
    ...atual,
    valores: { ...atual.valores, [classe]: ordem.valor },
    ordens:
      ordem.quantidade > 0n ? [...atual.ordens, ordem] : atual.ordens,
  };
}

// Quantas unidades inteiras do preço cabem no valor.
function unidadesEm(valor: Dinheiro, preco: Dinheiro): bigint {
  return valor.razaoSobre(preco, 1n, 'truncar');
}

const lados = { venda: 'vendas', compra: 'compras' } as const;

// As políticas: os valores de um lado da proposta viram unidades
// inteiras. Só a sobra das compras volta ao caixa; a venda inteira só
// rende menos, e quem investe usa o que ela rendeu.
function inteiras(tipo: Ordem['tipo']): PoliticaDeRebalanceamento {
  return ({ representantes }, proposta) => {
    const lado = lados[tipo];
    const { valores, ordens, semRepresentante } = emOrdens(
      tipo,
      proposta[lado],
      representantes,
    );
    const sobra = totalDe(proposta[lado]).subtrair(totalDe(valores));
    return {
      ...proposta,
      [lado]: valores,
      caixa:
        tipo === 'compra'
          ? proposta.caixa.somar(sobra)
          : proposta.caixa,
      ordens: [...proposta.ordens, ...ordens],
      semRepresentante: [
        ...proposta.semRepresentante,
        ...semRepresentante,
      ],
    };
  };
}

// As vendas viram ações inteiras antes de investir, para que as
// compras usem o que a venda inteira rende.
export const vendasInteiras = inteiras('venda');
export const comprasInteiras = inteiras('compra');
// #endregion

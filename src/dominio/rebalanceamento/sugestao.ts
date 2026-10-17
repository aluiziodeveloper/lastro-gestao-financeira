import type { Composicao } from '../alocacao/composicao.js';
import {
  type ClasseDeAtivo,
  classesDeAtivo,
} from '../classe-de-ativo.js';
import { Dinheiro } from '../dinheiro.js';

// #region sugestao
// O que comprar e vender em cada classe, e o dinheiro que sobra. É uma
// sugestão: quem decide é a investidora.
export type ValoresPorClasse = Readonly<
  Record<ClasseDeAtivo, Dinheiro>
>;

export interface Sugestao {
  readonly compras: ValoresPorClasse;
  readonly vendas: ValoresPorClasse;
  readonly caixa: Dinheiro;
}

export const zero = Dinheiro.deCentavos(0n);

export const nenhumValor: ValoresPorClasse = {
  acao: zero,
  fii: zero,
  etf: zero,
};
// #endregion

export const propostaVazia: Sugestao = {
  compras: nenhumValor,
  vendas: nenhumValor,
  caixa: zero,
};

// O total das vendas de todas as classes.
export function totalDe(valores: ValoresPorClasse): Dinheiro {
  return classesDeAtivo.reduce(
    (total, classe) => total.somar(valores[classe]),
    zero,
  );
}

// A carteira como fica depois das vendas, antes das compras.
export function depoisDasVendas(
  { total, porClasse }: Composicao,
  vendas: ValoresPorClasse,
): Composicao {
  const restante = (classe: ClasseDeAtivo): Dinheiro =>
    porClasse[classe].subtrair(vendas[classe]);
  return {
    total: total.subtrair(totalDe(vendas)),
    porClasse: {
      acao: restante('acao'),
      fii: restante('fii'),
      etf: restante('etf'),
    },
  };
}

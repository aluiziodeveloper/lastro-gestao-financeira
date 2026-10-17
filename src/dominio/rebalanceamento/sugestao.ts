import type { ClasseDeAtivo } from '../classe-de-ativo.js';
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

import type { AlocacaoAlvo } from '../alocacao/alocacao-alvo.js';
import type { Composicao } from '../alocacao/composicao.js';
import type { ClasseDeAtivo } from '../classe-de-ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import type { Cotacao } from '../mercado/cotacoes.js';
import type { Sugestao } from './sugestao.js';

// #region politica-interface
// O que a investidora tem para rebalancear: o aporte do mês e a margem
// de isenção que ainda resta.
export interface Recursos {
  readonly aporte: Dinheiro;
  readonly margem: Dinheiro;
}

// O ativo que a investidora usa para comprar e vender cada classe,
// com a cotação dele.
export type Representantes = Readonly<
  Partial<Record<ClasseDeAtivo, Cotacao>>
>;

export interface Situacao {
  readonly composicao: Composicao;
  readonly alocacao: AlocacaoAlvo;
  readonly recursos: Recursos;
  readonly representantes: Representantes;
}

// Uma política recebe a situação e a proposta até aqui e devolve a
// proposta seguinte. Cada uma decide uma coisa, com nome, e pode ser
// testada sem as outras.
export type PoliticaDeRebalanceamento = (
  situacao: Situacao,
  proposta: Sugestao,
) => Sugestao;
// #endregion

// #region compor-politicas
// As políticas valem em ordem: cada uma recebe a proposta da anterior.
export function compor(
  ...politicas: readonly PoliticaDeRebalanceamento[]
): PoliticaDeRebalanceamento {
  return (situacao, inicial) =>
    politicas.reduce(
      (proposta, politica) => politica(situacao, proposta),
      inicial,
    );
}

// Uma especificação diz se uma situação cumpre uma condição, separada
// da política que depende dela.
export type Especificacao = (situacao: Situacao) => boolean;

// A política só age quando a especificação vale; senão, a proposta
// passa adiante sem mudar.
export function quando(
  condicao: Especificacao,
  politica: PoliticaDeRebalanceamento,
): PoliticaDeRebalanceamento {
  return (situacao, proposta) =>
    condicao(situacao) ? politica(situacao, proposta) : proposta;
}
// #endregion

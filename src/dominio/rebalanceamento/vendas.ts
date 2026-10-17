import type { AlocacaoAlvo } from '../alocacao/alocacao-alvo.js';
import type { Composicao } from '../alocacao/composicao.js';
import { desenquadramentos } from '../alocacao/desenquadramento.js';
import type { Dinheiro } from '../dinheiro.js';
import { cemPorCento } from '../mercado/pontos-base.js';
import type { RegrasDeApuracao } from '../regime/regime-tributario.js';
import { arredondamentoDoAlvo, porAporte } from './aportes.js';
import { nenhumValor, type Sugestao, zero } from './sugestao.js';

// #region vendas-na-margem
// O que ainda se vende de ações no mês sem perder a isenção: o limite
// do regime menos o já vendido. Sem isenção no regime, ou com o limite
// já passado, a margem é zero.
export function margemDeIsencao(
  regras: RegrasDeApuracao,
  vendidoNoMes: Dinheiro,
): Dinheiro {
  const limite = regras['acoes-comum'].isencaoAte;
  if (limite === undefined || vendidoNoMes.excede(limite)) {
    return zero;
  }
  return limite.subtrair(vendidoNoMes);
}

export interface Recursos {
  readonly aporte: Dinheiro;
  readonly margem: Dinheiro;
}

// Só as ações se vendem, só quando estão acima da banda, só o que
// passa do alvo e só até a margem. O dinheiro da venda, com o aporte,
// vai às classes abaixo do alvo, como um aporte.
export function rebalancear(
  composicao: Composicao,
  alocacao: AlocacaoAlvo,
  { aporte, margem }: Recursos,
): Sugestao {
  const acima = desenquadramentos(composicao, alocacao).some(
    ({ classe, direcao }) => classe === 'acao' && direcao === 'acima',
  );
  const excesso = acima
    ? excessoDeAcoes(composicao, alocacao, aporte)
    : zero;
  const venda = excesso.excede(margem) ? margem : excesso;
  const depois: Composicao = {
    ...composicao,
    total: composicao.total.subtrair(venda),
    porClasse: {
      ...composicao.porClasse,
      acao: composicao.porClasse.acao.subtrair(venda),
    },
  };
  const compras = porAporte(depois, alocacao, aporte.somar(venda));
  return { ...compras, vendas: { ...nenhumValor, acao: venda } };
}

// O valor das ações acima do alvo, calculado sobre o total com o
// aporte, que a venda não muda.
function excessoDeAcoes(
  { total, porClasse }: Composicao,
  alocacao: AlocacaoAlvo,
  aporte: Dinheiro,
): Dinheiro {
  const alvo = total
    .somar(aporte)
    .multiplicarPorFracao(
      alocacao.fatiaDe('acao').alvo,
      cemPorCento,
      arredondamentoDoAlvo,
    );
  return porClasse.acao.subtrair(alvo);
}
// #endregion

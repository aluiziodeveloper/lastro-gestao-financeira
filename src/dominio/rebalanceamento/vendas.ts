import type { AlocacaoAlvo } from '../alocacao/alocacao-alvo.js';
import type { Composicao } from '../alocacao/composicao.js';
import { desenquadramentos } from '../alocacao/desenquadramento.js';
import type { Dinheiro } from '../dinheiro.js';
import { cemPorCento } from '../mercado/pontos-base.js';
import type { RegrasDeApuracao } from '../regime/regime-tributario.js';
import { arredondamentoDoAlvo } from './aportes.js';
import type {
  Especificacao,
  PoliticaDeRebalanceamento,
} from './politica.js';
import { zero } from './sugestao.js';

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

// A especificação: as ações estão acima da banda.
export const acoesAcimaDaBanda: Especificacao = ({
  composicao,
  alocacao,
}) =>
  desenquadramentos(composicao, alocacao).some(
    ({ classe, direcao }) => classe === 'acao' && direcao === 'acima',
  );

// Política: vender o que passa do alvo nas ações, só até a margem.
// Só as ações se vendem: toda venda de FII ou ETF com lucro paga
// imposto. Ações no alvo ou abaixo dele não têm o que vender.
export const venderAcoesNaMargem: PoliticaDeRebalanceamento = (
  { composicao, alocacao, recursos },
  proposta,
) => {
  const excesso = excessoDeAcoes(composicao, alocacao, recursos.aporte);
  if (!excesso.ehPositivo()) {
    return proposta;
  }
  const venda = excesso.excede(recursos.margem)
    ? recursos.margem
    : excesso;
  return { ...proposta, vendas: { ...proposta.vendas, acao: venda } };
};

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

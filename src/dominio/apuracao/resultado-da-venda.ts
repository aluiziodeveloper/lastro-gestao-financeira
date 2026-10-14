import type { Carteira } from '../carteira.js';
import type { Dinheiro } from '../dinheiro.js';
import type { ErroDeCarteira } from '../erros.js';
import {
  type Operacao,
  type Venda,
  valorBrutoDaOperacao,
} from '../operacao.js';
import { ok, type Result } from '../resultado.js';

// #region resultado-da-venda
// O que uma venda leva para a apuração: o valor de alienação, que conta
// para o total vendido no mês, e o resultado, positivo ou negativo.
export interface ResultadoDaVenda {
  readonly venda: Venda;
  readonly valorDeAlienacao: Dinheiro;
  readonly resultado: Dinheiro;
}

export interface Registro {
  readonly carteira: Carteira;
  readonly venda: ResultadoDaVenda | undefined;
}

// O custo baixado sai da carteira: o custo total do ativo antes da
// venda menos o de depois. A regra da baixa fica só na posição.
export function registrarNaCarteira(
  carteira: Carteira,
  operacao: Operacao,
): Result<Registro, ErroDeCarteira> {
  const antes = carteira.custoTotalDe(operacao.ticker);
  const registrada = carteira.registrar(operacao);
  if (!registrada.ok) {
    return registrada;
  }
  const depois = registrada.valor;
  if (operacao.tipo === 'compra') {
    return ok({ carteira: depois, venda: undefined });
  }
  const baixado = antes.subtrair(depois.custoTotalDe(operacao.ticker));
  return ok({
    carteira: depois,
    venda: resultadoDe(operacao, baixado),
  });
}

// Valor de alienação, menos os custos da nota de venda e o custo
// baixado (IN RFB 1.585/2015, arts. 56, § 3º, e 58).
function resultadoDe(
  venda: Venda,
  baixado: Dinheiro,
): ResultadoDaVenda {
  const valorDeAlienacao = valorBrutoDaOperacao(
    venda.precoUnitario,
    venda.quantidade,
  );
  return {
    venda,
    valorDeAlienacao,
    resultado: valorDeAlienacao
      .subtrair(venda.custos)
      .subtrair(baixado),
  };
}
// #endregion

import type { CatalogoDeAtivos, ErroDeCatalogo } from '../ativo.js';
import { Dinheiro } from '../dinheiro.js';
import { type Operacao, valorBrutoDaOperacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';

// #region resultado-do-day-trade
// O day trade não passa pela carteira: o resultado sai dos próprios
// negócios do dia, as vendas menos as compras, com os custos de cada
// lado (IN RFB 1.585/2015, art. 65).
export interface ResultadoDoDayTrade {
  readonly totalVendido: Dinheiro;
  readonly resultado: Dinheiro;
}

export function resultadoDoDayTrade(
  operacoes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<ResultadoDoDayTrade, ErroDeCatalogo> {
  const foraDoCatalogo = operacoes
    .map((operacao) => catalogo.classeDe(operacao.ticker))
    .find((classe) => !classe.ok);
  if (foraDoCatalogo !== undefined) {
    return foraDoCatalogo;
  }
  const zero = Dinheiro.deCentavos(0n);
  return ok(
    operacoes.reduce(somar, { totalVendido: zero, resultado: zero }),
  );
}
// #endregion

function somar(
  { totalVendido, resultado }: ResultadoDoDayTrade,
  operacao: Operacao,
): ResultadoDoDayTrade {
  const valor = valorBrutoDaOperacao(
    operacao.precoUnitario,
    operacao.quantidade,
  );
  if (operacao.tipo === 'compra') {
    return {
      totalVendido,
      resultado: resultado.subtrair(valor).subtrair(operacao.custos),
    };
  }
  return {
    totalVendido: totalVendido.somar(valor),
    resultado: resultado.somar(valor).subtrair(operacao.custos),
  };
}

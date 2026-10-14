import type { Operacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import {
  type ErroDeSeparacao,
  type Pareamento,
  parear,
} from './pareamento.js';

// #region classificar-day-trade
// O que vai para o day trade e o que segue para a carteira como
// operação comum.
export interface Separacao {
  readonly dayTrade: readonly Operacao[];
  readonly comum: readonly Operacao[];
}

// Day trade: compra e venda do mesmo ativo no mesmo dia (IN RFB
// 1.585/2015, art. 65). O estoque anterior não conta (§ 2º), e os
// negócios se pareiam na ordem em que aparecem (§ 3º).
export function separarDayTrade(
  operacoes: readonly Operacao[],
): Result<Separacao, ErroDeSeparacao> {
  const inicio: Result<Separacao, ErroDeSeparacao> = ok({
    dayTrade: [],
    comum: [],
  });
  return [...porDiaEAtivo(operacoes).values()].reduce(
    (separacao, doDia) =>
      separacao.ok
        ? juntar(separacao.valor, separarDia(doDia))
        : separacao,
    inicio,
  );
}
// #endregion

function porDiaEAtivo(
  operacoes: readonly Operacao[],
): Map<string, Operacao[]> {
  const grupos = new Map<string, Operacao[]>();
  for (const operacao of operacoes) {
    const chave = `${operacao.data} ${operacao.ticker.paraTexto()}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), operacao]);
  }
  return grupos;
}

function juntar(
  antes: Separacao,
  doDia: Result<Separacao, ErroDeSeparacao>,
): Result<Separacao, ErroDeSeparacao> {
  if (!doDia.ok) {
    return doDia;
  }
  return ok({
    dayTrade: [...antes.dayTrade, ...doDia.valor.dayTrade],
    comum: [...antes.comum, ...doDia.valor.comum],
  });
}

// A quantidade do day trade é a menor entre a comprada e a vendida.
function separarDia(
  doDia: readonly Operacao[],
): Result<Separacao, ErroDeSeparacao> {
  const compras = doDia.filter(
    (operacao) => operacao.tipo === 'compra',
  );
  const vendas = doDia.filter((operacao) => operacao.tipo === 'venda');
  const comprada = total(compras);
  const vendida = total(vendas);
  const pareada = comprada < vendida ? comprada : vendida;
  return unir(parear(compras, pareada), parear(vendas, pareada));
}

function unir(
  ladoDaCompra: Result<Pareamento, ErroDeSeparacao>,
  ladoDaVenda: Result<Pareamento, ErroDeSeparacao>,
): Result<Separacao, ErroDeSeparacao> {
  if (!ladoDaCompra.ok) {
    return ladoDaCompra;
  }
  if (!ladoDaVenda.ok) {
    return ladoDaVenda;
  }
  const compra = ladoDaCompra.valor;
  const venda = ladoDaVenda.valor;
  return ok({
    dayTrade: [...compra.dentro, ...venda.dentro],
    comum: [...compra.fora, ...venda.fora],
  });
}

function total(operacoes: readonly Operacao[]): bigint {
  return operacoes.reduce(
    (soma, operacao) => soma + operacao.quantidade.paraBigInt(),
    0n,
  );
}

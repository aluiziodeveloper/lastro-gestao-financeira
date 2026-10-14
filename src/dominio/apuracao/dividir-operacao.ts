import type { Dinheiro } from '../dinheiro.js';
import type { ErroDeOperacao } from '../erros.js';
import { criarCompra, criarVenda, type Operacao } from '../operacao.js';
import { type ErroDeQuantidade, Quantidade } from '../quantidade.js';
import { ok, type Result } from '../resultado.js';

export type ErroDeSeparacao = ErroDeOperacao | ErroDeQuantidade;

// #region dividir-operacao
// Divide um negócio em dois. Os custos vão na proporção da quantidade
// (IN RFB 1.585/2015, art. 56, § 4º): a parte arredonda meio para cima,
// e o resto leva a diferença.
export function dividir(
  operacao: Operacao,
  quantidade: bigint,
): Result<[Operacao, Operacao], ErroDeSeparacao> {
  const custos = custosDaParte(operacao, quantidade);
  const resto = operacao.quantidade.paraBigInt() - quantidade;
  return ambas(
    comQuantidade(operacao, quantidade, custos),
    comQuantidade(operacao, resto, operacao.custos.subtrair(custos)),
  );
}
// #endregion

function custosDaParte(
  operacao: Operacao,
  quantidade: bigint,
): Dinheiro {
  return operacao.custos.multiplicarPorFracao(
    quantidade,
    operacao.quantidade.paraBigInt(),
    'meio-para-cima',
  );
}

// Cada parte nasce pelos construtores, como toda operação do Lastro.
function comQuantidade(
  operacao: Operacao,
  unidades: bigint,
  custos: Dinheiro,
): Result<Operacao, ErroDeSeparacao> {
  const quantidade = Quantidade.criar(Number(unidades));
  if (!quantidade.ok) {
    return quantidade;
  }
  const criar = operacao.tipo === 'compra' ? criarCompra : criarVenda;
  return criar({ ...operacao, quantidade: quantidade.valor, custos });
}

function ambas(
  primeira: Result<Operacao, ErroDeSeparacao>,
  segunda: Result<Operacao, ErroDeSeparacao>,
): Result<[Operacao, Operacao], ErroDeSeparacao> {
  if (!primeira.ok) {
    return primeira;
  }
  if (!segunda.ok) {
    return segunda;
  }
  return ok([primeira.valor, segunda.valor]);
}

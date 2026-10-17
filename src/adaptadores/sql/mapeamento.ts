import { criarDataDePregao } from '../../dominio/data-de-pregao.js';
import { Dinheiro } from '../../dominio/dinheiro.js';
import type { ErroDeOperacao } from '../../dominio/erros.js';
import { criarIdDeOperacao } from '../../dominio/id-de-operacao.js';
import {
  criarCompra,
  criarVenda,
  type Operacao,
} from '../../dominio/operacao.js';
import { Quantidade } from '../../dominio/quantidade.js';
import type { Result } from '../../dominio/resultado.js';
import { Ticker } from '../../dominio/ticker.js';

// #region mapeamento
// Uma linha da tabela, como os dois bancos a entregam depois de cada
// adaptador converter os inteiros em bigint. As colunas em snake_case
// chegam com os nomes do Lastro, pelos apelidos do SELECT.
export interface LinhaDeOperacao {
  readonly id: string;
  readonly tipo: string;
  readonly data: string;
  readonly ticker: string;
  readonly quantidade: bigint;
  readonly precoEmCentavos: bigint;
  readonly custosEmCentavos: bigint;
}

export const colunas = `id, tipo, data, ticker, quantidade,
  preco_centavos AS "precoEmCentavos",
  custos_centavos AS "custosEmCentavos"`;

// Da operação para os valores da linha, na ordem das colunas.
export function valoresDa(
  operacao: Operacao,
): readonly (string | bigint)[] {
  return [
    operacao.id,
    operacao.tipo,
    operacao.data,
    operacao.ticker.paraTexto(),
    operacao.quantidade.paraBigInt(),
    operacao.precoUnitario.emCentavos(),
    operacao.custos.emCentavos(),
  ];
}

// Da linha para a operação, pelos construtores do domínio: o banco não
// cria operação que o Lastro recusaria. Uma linha inválida é falha do
// banco, e não regra de negócio, e por isso lança um erro.
export function operacaoDa(linha: LinhaDeOperacao): Operacao {
  const campos = {
    id: valido(criarIdDeOperacao(linha.id), linha),
    data: valido(criarDataDePregao(linha.data), linha),
    ticker: valido(Ticker.criar(linha.ticker), linha),
    quantidade: valido(
      Quantidade.criar(Number(linha.quantidade)),
      linha,
    ),
    precoUnitario: Dinheiro.deCentavos(linha.precoEmCentavos),
    custos: Dinheiro.deCentavos(linha.custosEmCentavos),
  };
  const operacao: Result<Operacao, ErroDeOperacao> =
    linha.tipo === 'venda' ? criarVenda(campos) : criarCompra(campos);
  return valido(operacao, linha);
}

function valido<T, E>(
  resultado: Result<T, E>,
  linha: LinhaDeOperacao,
): T {
  if (!resultado.ok) {
    throw new Error(`Operação inválida no banco: ${linha.id}`);
  }
  return resultado.valor;
}
// #endregion

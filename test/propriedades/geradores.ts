import fc from 'fast-check';

import { criarDataDePregao } from '../../src/dominio/data-de-pregao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  criarDesdobramento,
  criarGrupamento,
  type EventoCorporativo,
} from '../../src/dominio/eventos.js';
import { criarIdDeOperacao } from '../../src/dominio/id-de-operacao.js';
import {
  criarCompra,
  criarVenda,
  type Operacao,
} from '../../src/dominio/operacao.js';
import { Proporcao } from '../../src/dominio/proporcao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';

// #region gerador-ticker
// Quatro letras e o número da classe, como os códigos da B3. O valor
// passa pelo construtor do Capítulo 3, que decide o que é válido.
export const umTicker = fc
  .tuple(
    fc.stringMatching(/^[A-Z]{4}$/),
    fc.constantFrom('3', '4', '11'),
  )
  .map(([letras, classe]) => extrair(Ticker.criar(letras + classe)));
// #endregion

// Quantidades pequenas, para que as vendas encontrem posição.
export const umaQuantidade = fc
  .integer({ min: 1, max: 1_000 })
  .map((unidades) => extrair(Quantidade.criar(unidades)));

const umPreco = fc
  .bigInt({ min: 1n, max: 100_000n })
  .map((centavos) => Dinheiro.deCentavos(centavos));

// O Date só conta os dias, em UTC, para que o fuso não troque a data
// (Capítulo 3); quem valida a data é o construtor do Lastro.
function dataDoPregao(dias: number) {
  const data = new Date(Date.UTC(2026, 0, 2 + dias));
  return extrair(criarDataDePregao(data.toISOString().slice(0, 10)));
}

// #region gerador-operacoes
// Compras e vendas em ordem cronológica: cada passo avança de 0 a 3
// dias. Os custos ficam zerados, porque R2 não depende deles.
function operacoesEmOrdem(tickers: readonly Ticker[]) {
  const umPasso = fc.record({
    tipo: fc.constantFrom('compra', 'venda'),
    ticker: fc.constantFrom(...tickers),
    quantidade: umaQuantidade,
    preco: umPreco,
    avanco: fc.integer({ min: 0, max: 3 }),
  });
  return fc.array(umPasso, { maxLength: 30 }).map((passos) => {
    let dias = 0;
    return passos.map((passo, indice): Operacao => {
      dias += passo.avanco;
      const campos = {
        id: extrair(criarIdDeOperacao(`op-${String(indice)}`)),
        data: dataDoPregao(dias),
        ticker: passo.ticker,
        quantidade: passo.quantidade,
        precoUnitario: passo.preco,
        custos: Dinheiro.deCentavos(0n),
      };
      return passo.tipo === 'compra'
        ? extrair(criarCompra(campos))
        : extrair(criarVenda(campos));
    });
  });
}

// De um a três ativos distintos, e depois as operações sobre eles.
export const operacoes = fc
  .uniqueArray(umTicker, {
    minLength: 1,
    maxLength: 3,
    selector: (ticker) => ticker.paraTexto(),
  })
  .chain(operacoesEmOrdem);
// #endregion

// #region gerador-eventos
// Os termos de um desdobramento ou grupamento, de 1 a 20. O evento é
// montado a partir deles, e o contraexemplo mostra só os termos.
export interface Termos {
  readonly de: number;
  readonly para: number;
}

export const termosDeEvento = fc
  .record({
    de: fc.integer({ min: 1, max: 20 }),
    para: fc.integer({ min: 1, max: 20 }),
  })
  .filter(({ de, para }) => de !== para);

export function eventoCom(
  ticker: Ticker,
  { de, para }: Termos,
): EventoCorporativo {
  const campos = {
    id: extrair(criarIdDeOperacao('ev-001')),
    data: dataDoPregao(400),
    ticker,
    proporcao: Proporcao.entre(
      extrair(Quantidade.criar(de)),
      extrair(Quantidade.criar(para)),
    ),
  };
  return para > de
    ? criarDesdobramento(campos)
    : criarGrupamento(campos);
}
// #endregion

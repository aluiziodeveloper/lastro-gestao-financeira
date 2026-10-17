import { criarDataDePregao } from '../../src/dominio/data-de-pregao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeOperacao } from '../../src/dominio/id-de-operacao.js';
import {
  type CamposDaOperacao,
  type Compra,
  criarCompra,
  criarVenda,
  type Venda,
} from '../../src/dominio/operacao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';

// #region construtores-de-cenario
// O teste diz só o que importa para o caso; o resto ganha um valor
// válido e neutro: o identificador op-001, PETR4, um pregão qualquer
// e custos zerados.
export interface Cenario {
  readonly id?: string;
  readonly ticker?: string;
  readonly data?: string;
  readonly quantidade: number;
  readonly precoEmCentavos: bigint;
  readonly custosEmCentavos?: bigint;
}

function campos(cenario: Cenario): CamposDaOperacao {
  return {
    id: extrair(criarIdDeOperacao(cenario.id ?? 'op-001')),
    data: extrair(criarDataDePregao(cenario.data ?? '2026-03-02')),
    ticker: extrair(Ticker.criar(cenario.ticker ?? 'PETR4')),
    quantidade: extrair(Quantidade.criar(cenario.quantidade)),
    precoUnitario: Dinheiro.deCentavos(cenario.precoEmCentavos),
    custos: Dinheiro.deCentavos(cenario.custosEmCentavos ?? 0n),
  };
}

export function umaCompra(cenario: Cenario): Compra {
  return extrair(criarCompra(campos(cenario)));
}

export function umaVenda(cenario: Cenario): Venda {
  return extrair(criarVenda(campos(cenario)));
}
// #endregion

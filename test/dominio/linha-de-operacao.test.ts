import { describe, expect, it } from 'vitest';

import { criarDataDePregao } from '../../src/dominio/data-de-pregao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeOperacao } from '../../src/dominio/id-de-operacao.js';
import {
  type ErroDeLinha,
  type LinhaDeOperacao,
  operacaoDeLinha,
} from '../../src/dominio/linha-de-operacao.js';
import {
  type CamposDaOperacao,
  criarCompra,
  criarVenda,
} from '../../src/dominio/operacao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { err } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';

// #region linha-de-operacao-teste
function linhaValida(
  ajuste: Partial<LinhaDeOperacao> = {},
): LinhaDeOperacao {
  return {
    id: 'op-001',
    tipo: 'compra',
    data: '2026-03-16',
    ticker: 'PETR4',
    quantidade: 100,
    precoEmCentavos: 38_47n,
    custosEmCentavos: 1_10n,
    ...ajuste,
  };
}

function camposDaLinhaValida(): CamposDaOperacao {
  return {
    id: extrair(criarIdDeOperacao('op-001')),
    data: extrair(criarDataDePregao('2026-03-16')),
    ticker: extrair(Ticker.criar('PETR4')),
    quantidade: extrair(Quantidade.criar(100)),
    precoUnitario: Dinheiro.deCentavos(38_47n),
    custos: Dinheiro.deCentavos(1_10n),
  };
}

describe('operacaoDeLinha (desafio do Capítulo 3)', () => {
  it('cria uma compra a partir de uma linha válida', () => {
    expect(operacaoDeLinha(linhaValida())).toEqual(
      criarCompra(camposDaLinhaValida()),
    );
  });

  it('cria uma venda a partir de uma linha válida', () => {
    expect(operacaoDeLinha(linhaValida({ tipo: 'venda' }))).toEqual(
      criarVenda(camposDaLinhaValida()),
    );
  });

  it.each<[string, Partial<LinhaDeOperacao>, ErroDeLinha]>([
    ['id vazio', { id: ' ' }, { tipo: 'id-de-operacao-vazio' }],
    [
      'tipo desconhecido',
      { tipo: 'C' },
      { tipo: 'tipo-de-operacao-desconhecido', texto: 'C' },
    ],
    [
      'data inexistente',
      { data: '2026-02-30' },
      { tipo: 'data-inexistente', texto: '2026-02-30' },
    ],
    [
      'ticker do fracionário',
      { ticker: 'PETR4F' },
      { tipo: 'ticker-fora-do-formato', texto: 'PETR4F' },
    ],
    [
      'quantidade zero',
      { quantidade: 0 },
      { tipo: 'quantidade-nao-positiva', unidades: 0 },
    ],
    [
      'preço zero',
      { precoEmCentavos: 0n },
      {
        tipo: 'preco-nao-positivo',
        precoUnitario: Dinheiro.deCentavos(0n),
      },
    ],
    [
      'custos negativos',
      { custosEmCentavos: -1n },
      { tipo: 'custos-negativos', custos: Dinheiro.deCentavos(-1n) },
    ],
  ])('recusa a linha com %s', (_descricao, ajuste, erro) => {
    expect(operacaoDeLinha(linhaValida(ajuste))).toEqual(err([erro]));
  });

  it('acumula as falhas de data, ticker e quantidade', () => {
    const linha = linhaValida({
      data: '16/03/2026',
      ticker: 'PETR4F',
      quantidade: 1.5,
    });
    expect(operacaoDeLinha(linha)).toEqual(
      err([
        { tipo: 'data-fora-do-formato', texto: '16/03/2026' },
        { tipo: 'ticker-fora-do-formato', texto: 'PETR4F' },
        { tipo: 'quantidade-nao-inteira', unidades: 1.5 },
      ]),
    );
  });

  it('acumula preço e custos inválidos numa linha sem outras falhas', () => {
    const linha = linhaValida({
      precoEmCentavos: 0n,
      custosEmCentavos: -1n,
    });
    expect(operacaoDeLinha(linha)).toEqual(
      err([
        {
          tipo: 'preco-nao-positivo',
          precoUnitario: Dinheiro.deCentavos(0n),
        },
        { tipo: 'custos-negativos', custos: Dinheiro.deCentavos(-1n) },
      ]),
    );
  });

  it('acumula uma falha por campo, na ordem dos campos', () => {
    const linha: LinhaDeOperacao = {
      id: '',
      tipo: 'troca',
      data: '2026-13-01',
      ticker: '',
      quantidade: -100,
      precoEmCentavos: -38_47n,
      custosEmCentavos: -1_10n,
    };
    expect(operacaoDeLinha(linha)).toEqual(
      err([
        { tipo: 'id-de-operacao-vazio' },
        { tipo: 'tipo-de-operacao-desconhecido', texto: 'troca' },
        { tipo: 'data-inexistente', texto: '2026-13-01' },
        { tipo: 'ticker-fora-do-formato', texto: '' },
        { tipo: 'quantidade-nao-positiva', unidades: -100 },
        {
          tipo: 'preco-nao-positivo',
          precoUnitario: Dinheiro.deCentavos(-38_47n),
        },
        {
          tipo: 'custos-negativos',
          custos: Dinheiro.deCentavos(-1_10n),
        },
      ]),
    );
  });
});
// #endregion

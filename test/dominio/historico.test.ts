import { describe, expect, it } from 'vitest';

import {
  carteiraDoHistorico,
  movimentosAte,
} from '../../src/dominio/historico.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes } from './referencias.js';

const id = extrair(criarIdDeCarteira('carteira-1'));
const petr4 = extrair(Ticker.criar('PETR4'));
const compraDeFevereiro = umaCompra({
  data: '2026-02-02',
  quantidade: 100,
  precoEmCentavos: 30_00n,
});
const vendaDeAbril = umaVenda({
  data: '2026-04-15',
  quantidade: 100,
  precoEmCentavos: 32_00n,
});

describe('Carteira do histórico', () => {
  it('registra as operações de novo, em ordem', () => {
    const carteira = extrair(
      carteiraDoHistorico(id, [compraDeFevereiro, vendaDeAbril]),
    );

    expect(carteira.quantidadeDe(petr4)).toBe(0n);
    expect(carteira.ativos()).toEqual([]);
  });

  it('recusa o histórico que a carteira recusaria', () => {
    const historico = carteiraDoHistorico(id, [vendaDeAbril]);

    expect(historico.ok).toBe(false);
  });
});

// #region movimentos-ate-teste
describe('Movimentos até um mês', () => {
  it('do primeiro mês operado ao pedido, com os vazios', () => {
    const movimentos = movimentosAte(
      [compraDeFevereiro, vendaDeAbril],
      mes('2026-04'),
    );

    expect(movimentos.map(({ mes: m }) => m)).toEqual([
      mes('2026-02'),
      mes('2026-03'),
      mes('2026-04'),
    ]);
    expect(movimentos.map(({ operacoes }) => operacoes.length)).toEqual(
      [1, 0, 1],
    );
  });

  it('deixa de fora as operações depois do mês pedido', () => {
    const movimentos = movimentosAte(
      [compraDeFevereiro, vendaDeAbril],
      mes('2026-03'),
    );

    expect(movimentos.flatMap(({ operacoes }) => operacoes)).toEqual([
      compraDeFevereiro,
    ]);
  });

  it.each([
    ['sem operações', []],
    ['com a primeira operação depois do mês', [vendaDeAbril]],
  ])('%s, devolve o próprio mês, vazio', (_, operacoes) => {
    expect(movimentosAte(operacoes, mes('2026-01'))).toEqual([
      { mes: mes('2026-01'), operacoes: [], retencoes: [] },
    ]);
  });
});
// #endregion

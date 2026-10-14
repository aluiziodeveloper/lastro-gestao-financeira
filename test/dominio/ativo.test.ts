import { describe, expect, it } from 'vitest';

import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';

function ticker(codigo: string): Ticker {
  return extrair(Ticker.criar(codigo));
}

// #region catalogo-de-ativos-teste
describe('Catálogo de ativos', () => {
  const catalogo = CatalogoDeAtivos.vazio()
    .com(ticker('PETR4'), 'acao')
    .com(ticker('HGLG11'), 'fii')
    .com(ticker('BOVA11'), 'etf')
    .com(ticker('TAEE11'), 'acao');

  it.each([
    ['PETR4', 'acao'],
    ['HGLG11', 'fii'],
    ['BOVA11', 'etf'],
    ['TAEE11', 'acao'],
  ] as const)('classifica %s como %s', (codigo, classe) => {
    expect(catalogo.classeDe(ticker(codigo))).toEqual(ok(classe));
  });

  it('recusa um ativo que não está no catálogo', () => {
    expect(catalogo.classeDe(ticker('VALE3'))).toEqual(
      err({ tipo: 'ativo-fora-do-catalogo', ticker: ticker('VALE3') }),
    );
  });

  it('acha o ativo pelo código normalizado', () => {
    expect(catalogo.classeDe(ticker(' hglg11 '))).toEqual(ok('fii'));
  });

  it('não muda o catálogo que recebeu a inclusão', () => {
    const vazio = CatalogoDeAtivos.vazio();
    vazio.com(ticker('PETR4'), 'acao');
    expect(vazio.classeDe(ticker('PETR4')).ok).toBe(false);
  });
});
// #endregion

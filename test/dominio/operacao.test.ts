import { describe, expect, it } from 'vitest';

import { criarDataDePregao } from '../../src/dominio/data-de-pregao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeOperacao } from '../../src/dominio/id-de-operacao.js';
import {
  type CamposDaOperacao,
  criarCompra,
  criarVenda,
  valorBrutoDaOperacao,
} from '../../src/dominio/operacao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { err } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';

// #region operacao-valor-bruto-teste
describe('valor bruto da operação', () => {
  it('vale R$ 1.000,00 para 100 ações a R$ 10,00', () => {
    expect(
      valorBrutoDaOperacao(
        Dinheiro.deCentavos(10_00n),
        extrair(Quantidade.criar(100)),
      ),
    ).toEqual(Dinheiro.deCentavos(1_000_00n));
  });
});
// #endregion

// #region operacao-valor-bruto-centavos
describe('valor bruto da operação com centavos', () => {
  it('vale R$ 115,00 para 100 ações a R$ 1,15', () => {
    expect(
      valorBrutoDaOperacao(
        Dinheiro.deCentavos(1_15n),
        extrair(Quantidade.criar(100)),
      ),
    ).toEqual(Dinheiro.deCentavos(115_00n));
  });
});
// #endregion

// #region operacao-construtores-teste
function camposValidos(
  ajuste: Partial<CamposDaOperacao> = {},
): CamposDaOperacao {
  return {
    id: extrair(criarIdDeOperacao('op-001')),
    data: extrair(criarDataDePregao('2026-03-16')),
    ticker: extrair(Ticker.criar('PETR4')),
    quantidade: extrair(Quantidade.criar(100)),
    precoUnitario: Dinheiro.deCentavos(38_47n),
    custos: Dinheiro.deCentavos(1_10n),
    ...ajuste,
  };
}

describe('construtores de compra e venda', () => {
  it('cria uma compra com os campos recebidos', () => {
    const compra = extrair(criarCompra(camposValidos()));
    expect(compra.tipo).toBe('compra');
    expect(compra.precoUnitario).toEqual(Dinheiro.deCentavos(38_47n));
  });

  it('cria uma venda com os campos recebidos', () => {
    expect(extrair(criarVenda(camposValidos())).tipo).toBe('venda');
  });

  it('aceita custos zerados', () => {
    const campos = camposValidos({ custos: Dinheiro.deCentavos(0n) });
    expect(criarCompra(campos).ok).toBe(true);
  });

  it.each([
    ['zero', 0n],
    ['negativo', -1n],
  ])('recusa preço unitário %s', (_descricao, centavos) => {
    const precoUnitario = Dinheiro.deCentavos(centavos);
    expect(criarCompra(camposValidos({ precoUnitario }))).toEqual(
      err({ tipo: 'preco-nao-positivo', precoUnitario }),
    );
  });

  it('recusa custos negativos', () => {
    const custos = Dinheiro.deCentavos(-1n);
    expect(criarVenda(camposValidos({ custos }))).toEqual(
      err({ tipo: 'custos-negativos', custos }),
    );
  });

  it('informa o primeiro erro quando há mais de um', () => {
    const campos = camposValidos({
      precoUnitario: Dinheiro.deCentavos(0n),
      custos: Dinheiro.deCentavos(-1n),
    });
    const resultado = criarCompra(campos);
    expect(resultado.ok ? undefined : resultado.erro.tipo).toBe(
      'preco-nao-positivo',
    );
  });
});
// #endregion

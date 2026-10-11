import { describe, expect, it } from 'vitest';

import { Carteira } from '../../src/dominio/carteira.js';
import { criarDataDePregao } from '../../src/dominio/data-de-pregao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  type CamposDoEvento,
  criarDesdobramento,
  criarGrupamento,
} from '../../src/dominio/eventos.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { criarIdDeOperacao } from '../../src/dominio/id-de-operacao.js';
import { Proporcao } from '../../src/dominio/proporcao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { err } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra } from './construtores.js';

const vale3 = extrair(Ticker.criar('VALE3'));

// O evento só diz o que importa ao caso: a proporção e, quando conta,
// a data. Ativo e identificador ficam fixos.
function evento(
  de: number,
  para: number,
  data = '2026-03-20',
): CamposDoEvento {
  return {
    id: extrair(criarIdDeOperacao('ev-001')),
    data: extrair(criarDataDePregao(data)),
    ticker: vale3,
    proporcao: Proporcao.entre(
      extrair(Quantidade.criar(de)),
      extrair(Quantidade.criar(para)),
    ),
  };
}

function carteiraCom(quantidade: number): Carteira {
  return extrair(
    Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))).registrar(
      umaCompra({
        ticker: 'VALE3',
        data: '2026-03-05',
        quantidade,
        precoEmCentavos: 61_40n,
      }),
    ),
  );
}

// #region eventos-testes
describe('R3 · desdobramento e grupamento', () => {
  it('multiplica a quantidade no desdobramento 1:2', () => {
    const carteira = extrair(
      carteiraCom(300).aplicar(criarDesdobramento(evento(1, 2))),
    );

    expect(carteira.quantidadeDe(vale3)).toBe(600n);
  });

  it('divide a quantidade no grupamento 10:1', () => {
    const carteira = extrair(
      carteiraCom(300).aplicar(criarGrupamento(evento(10, 1))),
    );

    expect(carteira.quantidadeDe(vale3)).toBe(30n);
  });

  it('não muda a carteira sem posição no ativo', () => {
    const vazia = Carteira.abrir(
      extrair(criarIdDeCarteira('carteira-1')),
    );

    const carteira = extrair(
      vazia.aplicar(criarDesdobramento(evento(1, 2))),
    );

    expect(carteira.quantidadeDe(vale3)).toBe(0n);
  });

  it.each([
    [2, 1],
    [1, 1],
  ])('recusa o desdobramento %i:%i, que não aumenta', (de, para) => {
    expect(
      carteiraCom(300).aplicar(criarDesdobramento(evento(de, para))),
    ).toEqual(
      err({ tipo: 'proporcao-invalida', evento: 'desdobramento' }),
    );
  });

  it.each([
    [1, 10],
    [1, 1],
  ])('recusa o grupamento %i:%i, que não reduz', (de, para) => {
    expect(
      carteiraCom(300).aplicar(criarGrupamento(evento(de, para))),
    ).toEqual(
      err({ tipo: 'proporcao-invalida', evento: 'grupamento' }),
    );
  });

  it('recusa o desdobramento que passa do limite de quantidade', () => {
    expect(
      carteiraCom(Number.MAX_SAFE_INTEGER).aplicar(
        criarDesdobramento(evento(1, 2)),
      ),
    ).toEqual(
      err({
        tipo: 'quantidade-acima-do-limite',
        unidades: Number.MAX_SAFE_INTEGER * 2,
      }),
    );
  });

  it('recusa o evento anterior à última operação registrada', () => {
    const resultado = carteiraCom(300).aplicar(
      criarDesdobramento(evento(1, 2, '2026-03-02')),
    );

    expect(resultado.ok).toBe(false);
  });

  it('avança a última data, como uma operação', () => {
    const carteira = extrair(
      carteiraCom(300).aplicar(criarDesdobramento(evento(1, 2))),
    );

    const resultado = carteira.registrar(
      umaCompra({
        ticker: 'VALE3',
        data: '2026-03-10',
        quantidade: 100,
        precoEmCentavos: 31_00n,
      }),
    );

    expect(resultado.ok).toBe(false);
  });
});
// #endregion

// #region eventos-custo-conservado
// Com uma ação e com dez, um centavo a mais no custo total muda o
// preço médio; com trezentas, o arredondamento o esconderia.
describe('R3 · custo total conservado', () => {
  it('reduz o preço médio à metade no desdobramento 1:2', () => {
    const carteira = extrair(
      carteiraCom(1).aplicar(criarDesdobramento(evento(1, 2))),
    );

    expect(carteira.precoMedioDe(vale3, 'meio-para-cima')).toEqual(
      Dinheiro.deCentavos(30_70n),
    );
  });

  it('multiplica o preço médio por 10 no grupamento 10:1', () => {
    const carteira = extrair(
      carteiraCom(10).aplicar(criarGrupamento(evento(10, 1))),
    );

    expect(carteira.precoMedioDe(vale3, 'meio-para-cima')).toEqual(
      Dinheiro.deCentavos(614_00n),
    );
  });
});
// #endregion

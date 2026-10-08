import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { Posicao } from '../../src/dominio/posicao.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra } from './construtores.js';

describe('Posicao.precoMedio', () => {
  // #region pm-primeira-compra-teste
  it('retorna o preço unitário após abrir com uma compra', () => {
    const compra = umaCompra({
      quantidade: 200,
      precoEmCentavos: 36_20n,
    });

    const posicao = Posicao.abrir(compra);

    expect(posicao.precoMedio('meio-para-cima')).toEqual(
      Dinheiro.deCentavos(36_20n),
    );
  });
  // #endregion

  // #region pm-compras-sucessivas-teste
  it('retorna a média ponderada após comprar de novo', () => {
    const posicao = extrair(
      Posicao.abrir(
        umaCompra({ quantidade: 200, precoEmCentavos: 36_20n }),
      ).comprar(
        umaCompra({ quantidade: 100, precoEmCentavos: 38_90n }),
      ),
    );

    expect(posicao.precoMedio('meio-para-cima')).toEqual(
      Dinheiro.deCentavos(37_10n),
    );
  });
  // #endregion

  // #region pm-custos-operacionais-teste
  it('inclui os custos das notas no preço médio', () => {
    const posicao = extrair(
      Posicao.abrir(
        umaCompra({
          quantidade: 200,
          precoEmCentavos: 36_20n,
          custosEmCentavos: 10_85n,
        }),
      ).comprar(
        umaCompra({
          quantidade: 100,
          precoEmCentavos: 38_90n,
          custosEmCentavos: 13_15n,
        }),
      ),
    );

    expect(posicao.precoMedio('meio-para-cima')).toEqual(
      Dinheiro.deCentavos(37_18n),
    );
  });
  // #endregion

  it('recusa a compra que leva a quantidade acima do limite', () => {
    const posicao = Posicao.abrir(
      umaCompra({
        quantidade: Number.MAX_SAFE_INTEGER,
        precoEmCentavos: 1n,
      }),
    );

    expect(
      posicao.comprar(
        umaCompra({ quantidade: 1, precoEmCentavos: 1n }),
      ),
    ).toEqual(
      err({
        tipo: 'quantidade-acima-do-limite',
        unidades: Number.MAX_SAFE_INTEGER + 1,
      }),
    );
  });
});

import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { Posicao } from '../../src/dominio/posicao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';

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

  // #region pm-venda-parcial-teste
  it('mantém o preço médio após vender parte da posição', () => {
    const posicao = extrair(
      cenaDaCorretora().vender(
        umaVenda({ quantidade: 70, precoEmCentavos: 41_00n }),
      ),
    );

    expect(posicao.precoMedio('meio-para-cima')).toEqual(
      Dinheiro.deCentavos(37_18n),
    );
  });

  it('pondera a compra seguinte sobre o custo que restou', () => {
    const posicao = extrair(
      extrair(
        cenaDaCorretora().vender(
          umaVenda({ quantidade: 70, precoEmCentavos: 41_00n }),
        ),
      ).comprar(
        umaCompra({
          quantidade: 50,
          precoEmCentavos: 35_00n,
          custosEmCentavos: 7_03n,
        }),
      ),
    );

    expect(posicao.precoMedio('meio-para-cima')).toEqual(
      Dinheiro.deCentavos(36_82n),
    );
  });
  // #endregion

  it('deixa no que resta o centavo que a baixa arredondou', () => {
    const posicao = extrair(
      Posicao.abrir(
        umaCompra({
          quantidade: 3,
          precoEmCentavos: 333_33n,
          custosEmCentavos: 1n,
        }),
      ).vender(umaVenda({ quantidade: 1, precoEmCentavos: 340_00n })),
    );

    expect(posicao.precoMedio('meio-para-cima')).toEqual(
      Dinheiro.deCentavos(333_34n),
    );
  });

  it('recusa a venda acima da quantidade em carteira', () => {
    const posicao = Posicao.abrir(
      umaCompra({ quantidade: 100, precoEmCentavos: 36_20n }),
    );
    const venda = umaVenda({
      quantidade: 101,
      precoEmCentavos: 41_00n,
    });

    expect(posicao.vender(venda)).toEqual(
      err({
        tipo: 'venda-acima-da-posicao',
        emCarteira: extrair(Quantidade.criar(100)),
        vendida: venda.quantidade,
      }),
    );
  });

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

// A cena do capítulo: duas notas de PETR4, custo total de R$ 11.154,00
// em 300 ações.
function cenaDaCorretora(): Posicao {
  return extrair(
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
}

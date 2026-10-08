import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { Posicao } from '../../src/dominio/posicao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';

describe('R1 · preço médio', () => {
  describe('nas compras', () => {
    // #region pm-primeira-compra-teste
    it('é o preço unitário de uma compra sem custos', () => {
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
    it('pondera os preços pelas quantidades compradas', () => {
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
    it('inclui os custos operacionais de cada nota', () => {
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

    it('recusa a compra que passa do limite de quantidade', () => {
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

  describe('na venda parcial', () => {
    // #region pm-venda-parcial-teste
    it('não muda o preço médio do que resta', () => {
      const posicao = extrair(
        cenaDaCorretora().vender(
          umaVenda({ quantidade: 70, precoEmCentavos: 41_00n }),
        ),
      );

      expect(posicao.precoMedio('meio-para-cima')).toEqual(
        Dinheiro.deCentavos(37_18n),
      );
    });

    it('pondera a compra seguinte sobre o custo que resta', () => {
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

    it('deixa no que resta o centavo arredondado na baixa', () => {
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

    it('recusa vender mais que a quantidade em carteira', () => {
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
  });

  describe('no encerramento da posição', () => {
    // #region pm-encerrar-teste
    it('volta a zero quando a venda leva toda a posição', () => {
      const posicao = extrair(
        cenaDaCorretora().vender(
          umaVenda({ quantidade: 300, precoEmCentavos: 41_00n }),
        ),
      );

      expect(posicao.precoMedio('meio-para-cima')).toEqual(
        Dinheiro.deCentavos(0n),
      );
    });
    // #endregion

    it('recomeça na compra seguinte', () => {
      const posicao = extrair(
        extrair(
          cenaDaCorretora().vender(
            umaVenda({ quantidade: 300, precoEmCentavos: 41_00n }),
          ),
        ).comprar(
          umaCompra({ quantidade: 100, precoEmCentavos: 40_00n }),
        ),
      );

      expect(posicao.precoMedio('meio-para-cima')).toEqual(
        Dinheiro.deCentavos(40_00n),
      );
    });

    it('recusa nova venda sem quantidade em carteira', () => {
      const zerada = extrair(
        cenaDaCorretora().vender(
          umaVenda({ quantidade: 300, precoEmCentavos: 41_00n }),
        ),
      );
      const venda = umaVenda({
        quantidade: 1,
        precoEmCentavos: 41_00n,
      });

      expect(zerada.vender(venda)).toEqual(
        err({
          tipo: 'venda-acima-da-posicao',
          emCarteira: undefined,
          vendida: venda.quantidade,
        }),
      );
    });
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

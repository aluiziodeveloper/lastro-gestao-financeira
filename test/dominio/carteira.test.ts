import { describe, expect, it } from 'vitest';

import { Carteira } from '../../src/dominio/carteira.js';
import { criarDataDePregao } from '../../src/dominio/data-de-pregao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { err } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';

const vale3 = extrair(Ticker.criar('VALE3'));
const petr4 = extrair(Ticker.criar('PETR4'));

function carteiraVazia(id = 'carteira-1'): Carteira {
  return Carteira.abrir(extrair(criarIdDeCarteira(id)));
}

function comTrezentasVale3(): Carteira {
  return extrair(
    carteiraVazia().registrar(
      umaCompra({
        ticker: 'VALE3',
        quantidade: 300,
        precoEmCentavos: 61_40n,
      }),
    ),
  );
}

describe('Carteira', () => {
  describe('na identidade', () => {
    it('continua a mesma carteira depois de um registro', () => {
      const vazia = carteiraVazia();

      const registrada = extrair(
        vazia.registrar(
          umaCompra({
            ticker: 'VALE3',
            quantidade: 300,
            precoEmCentavos: 61_40n,
          }),
        ),
      );

      expect(registrada.mesmaCarteira(vazia)).toBe(true);
    });

    it('não é a mesma carteira que outra de outro identificador', () => {
      expect(
        carteiraVazia('carteira-1').mesmaCarteira(
          carteiraVazia('carteira-2'),
        ),
      ).toBe(false);
    });
  });

  describe('nas compras', () => {
    it('começa sem quantidade de nenhum ativo', () => {
      expect(carteiraVazia().quantidadeDe(vale3)).toBe(0n);
    });

    it('soma ao ativo a quantidade comprada', () => {
      const carteira = extrair(
        carteiraVazia().registrar(
          umaCompra({
            ticker: 'VALE3',
            quantidade: 300,
            precoEmCentavos: 61_40n,
          }),
        ),
      );

      expect(carteira.quantidadeDe(vale3)).toBe(300n);
    });

    it('calcula o preço médio de cada ativo', () => {
      const carteira = extrair(
        carteiraVazia().registrar(
          umaCompra({
            ticker: 'VALE3',
            quantidade: 300,
            precoEmCentavos: 61_40n,
          }),
        ),
      );

      expect(carteira.precoMedioDe(vale3, 'meio-para-cima')).toEqual(
        Dinheiro.deCentavos(61_40n),
      );
    });

    it('mantém uma posição separada para cada ativo', () => {
      const carteira = extrair(
        extrair(
          carteiraVazia().registrar(
            umaCompra({
              ticker: 'VALE3',
              quantidade: 300,
              precoEmCentavos: 61_40n,
            }),
          ),
        ).registrar(
          umaCompra({
            ticker: 'PETR4',
            quantidade: 200,
            precoEmCentavos: 36_20n,
          }),
        ),
      );

      expect(carteira.quantidadeDe(vale3)).toBe(300n);
      expect(carteira.quantidadeDe(petr4)).toBe(200n);
    });

    it('recusa a compra que passa do limite de quantidade', () => {
      const carteira = extrair(
        carteiraVazia().registrar(
          umaCompra({
            quantidade: Number.MAX_SAFE_INTEGER,
            precoEmCentavos: 1n,
          }),
        ),
      );

      expect(
        carteira.registrar(
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

  describe('nas vendas', () => {
    // #region carteira-descoberto-teste
    it('recusa a venda de um ativo sem posição', () => {
      const venda = umaVenda({
        ticker: 'VALE3',
        quantidade: 300,
        precoEmCentavos: 63_00n,
      });

      expect(carteiraVazia().registrar(venda)).toEqual(
        err({
          tipo: 'venda-a-descoberto',
          ticker: vale3,
          emCarteira: undefined,
          vendida: venda.quantidade,
        }),
      );
    });
    // #endregion

    it('recusa a venda acima da quantidade em carteira', () => {
      const venda = umaVenda({
        ticker: 'VALE3',
        quantidade: 301,
        precoEmCentavos: 63_00n,
      });

      expect(comTrezentasVale3().registrar(venda)).toEqual(
        err({
          tipo: 'venda-a-descoberto',
          ticker: vale3,
          emCarteira: extrair(Quantidade.criar(300)),
          vendida: venda.quantidade,
        }),
      );
    });

    it('baixa do ativo a quantidade vendida', () => {
      const carteira = extrair(
        comTrezentasVale3().registrar(
          umaVenda({
            ticker: 'VALE3',
            quantidade: 100,
            precoEmCentavos: 63_00n,
          }),
        ),
      );

      expect(carteira.quantidadeDe(vale3)).toBe(200n);
    });

    it('zera o ativo quando a venda leva toda a posição', () => {
      const carteira = extrair(
        comTrezentasVale3().registrar(
          umaVenda({
            ticker: 'VALE3',
            quantidade: 300,
            precoEmCentavos: 63_00n,
          }),
        ),
      );

      expect(carteira.quantidadeDe(vale3)).toBe(0n);
    });
  });

  describe('na ordem cronológica', () => {
    // #region carteira-ordem-teste
    it('recusa a operação anterior à última registrada', () => {
      const carteira = extrair(
        carteiraVazia().registrar(
          umaCompra({
            ticker: 'VALE3',
            data: '2026-03-12',
            quantidade: 300,
            precoEmCentavos: 63_00n,
          }),
        ),
      );

      expect(
        carteira.registrar(
          umaCompra({
            ticker: 'VALE3',
            data: '2026-03-05',
            quantidade: 300,
            precoEmCentavos: 61_40n,
          }),
        ),
      ).toEqual(
        err({
          tipo: 'operacao-fora-de-ordem',
          data: extrair(criarDataDePregao('2026-03-05')),
          ultimaData: extrair(criarDataDePregao('2026-03-12')),
        }),
      );
    });
    // #endregion

    it('recusa a data anterior mesmo em outro ativo', () => {
      const carteira = extrair(
        carteiraVazia().registrar(
          umaCompra({
            ticker: 'PETR4',
            data: '2026-03-12',
            quantidade: 200,
            precoEmCentavos: 36_20n,
          }),
        ),
      );

      const resultado = carteira.registrar(
        umaCompra({
          ticker: 'VALE3',
          data: '2026-03-05',
          quantidade: 300,
          precoEmCentavos: 61_40n,
        }),
      );

      expect(resultado.ok).toBe(false);
    });

    it.each([
      ['uma compra', umaCompra],
      ['uma venda', umaVenda],
    ])(
      'compara com a data mais recente, depois de %s',
      (_, operacao) => {
        const carteira = extrair(
          extrair(
            carteiraVazia().registrar(
              umaCompra({
                data: '2026-03-05',
                quantidade: 300,
                precoEmCentavos: 36_20n,
              }),
            ),
          ).registrar(
            operacao({
              data: '2026-03-12',
              quantidade: 100,
              precoEmCentavos: 36_20n,
            }),
          ),
        );

        expect(
          carteira.registrar(
            umaCompra({
              data: '2026-03-09',
              quantidade: 100,
              precoEmCentavos: 36_20n,
            }),
          ),
        ).toEqual(
          err({
            tipo: 'operacao-fora-de-ordem',
            data: extrair(criarDataDePregao('2026-03-09')),
            ultimaData: extrair(criarDataDePregao('2026-03-12')),
          }),
        );
      },
    );

    it('aceita compra e venda no mesmo pregão', () => {
      const carteira = extrair(
        extrair(
          carteiraVazia().registrar(
            umaCompra({
              ticker: 'VALE3',
              data: '2026-03-12',
              quantidade: 300,
              precoEmCentavos: 62_00n,
            }),
          ),
        ).registrar(
          umaVenda({
            ticker: 'VALE3',
            data: '2026-03-12',
            quantidade: 300,
            precoEmCentavos: 63_00n,
          }),
        ),
      );

      expect(carteira.quantidadeDe(vale3)).toBe(0n);
    });

    it('aceita a venda posterior à compra, como na nota', () => {
      const carteira = extrair(
        extrair(
          carteiraVazia().registrar(
            umaCompra({
              ticker: 'VALE3',
              data: '2026-03-05',
              quantidade: 300,
              precoEmCentavos: 61_40n,
            }),
          ),
        ).registrar(
          umaVenda({
            ticker: 'VALE3',
            data: '2026-03-12',
            quantidade: 100,
            precoEmCentavos: 63_00n,
          }),
        ),
      );

      expect(carteira.quantidadeDe(vale3)).toBe(200n);
    });
  });

  // #region carteira-imutabilidade-teste
  it('não muda a carteira que recebeu o registro', () => {
    const vazia = carteiraVazia();

    vazia.registrar(
      umaCompra({
        ticker: 'VALE3',
        quantidade: 300,
        precoEmCentavos: 61_40n,
      }),
    );

    expect(vazia.quantidadeDe(vale3)).toBe(0n);
  });
  // #endregion

  it('lança diante de um tipo que burlou o compilador', () => {
    const intrusa = {
      ...umaCompra({ quantidade: 1, precoEmCentavos: 1n }),
      tipo: 'transferencia',
    } as unknown as Operacao;

    expect(() => carteiraVazia().registrar(intrusa)).toThrow(
      'Caso não tratado',
    );
  });
});

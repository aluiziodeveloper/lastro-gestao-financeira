import { describe, expect, it } from 'vitest';

import { Carteira } from '../../src/dominio/carteira.js';
import { criarDataDePregao } from '../../src/dominio/data-de-pregao.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { criarIdDeOperacao } from '../../src/dominio/id-de-operacao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { err } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';

// #region carteira-lote-teste
const vale3 = extrair(Ticker.criar('VALE3'));

function comTrezentasVale3(): Carteira {
  return extrair(
    Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))).registrar(
      umaCompra({
        id: 'op-000',
        ticker: 'VALE3',
        data: '2026-03-02',
        quantidade: 300,
        precoEmCentavos: 61_40n,
      }),
    ),
  );
}

describe('registro de um lote de operações', () => {
  it('registra todas as operações de um lote válido', () => {
    const carteira = extrair(
      comTrezentasVale3().registrarTodas([
        umaCompra({
          id: 'op-001',
          ticker: 'VALE3',
          data: '2026-03-05',
          quantidade: 100,
          precoEmCentavos: 61_40n,
        }),
        umaVenda({
          id: 'op-002',
          ticker: 'VALE3',
          data: '2026-03-12',
          quantidade: 250,
          precoEmCentavos: 63_00n,
        }),
      ]),
    );

    expect(carteira.quantidadeDe(vale3)).toBe(150n);
  });

  it('não muda a carteira com um lote vazio', () => {
    const carteira = extrair(comTrezentasVale3().registrarTodas([]));

    expect(carteira.quantidadeDe(vale3)).toBe(300n);
  });

  it('recusa o lote com uma venda a descoberto no meio', () => {
    const venda = umaVenda({
      id: 'op-002',
      ticker: 'VALE3',
      data: '2026-03-12',
      quantidade: 500,
      precoEmCentavos: 63_00n,
    });

    expect(
      comTrezentasVale3().registrarTodas([
        umaCompra({
          id: 'op-001',
          ticker: 'VALE3',
          data: '2026-03-05',
          quantidade: 100,
          precoEmCentavos: 61_40n,
        }),
        venda,
        umaCompra({
          id: 'op-003',
          ticker: 'VALE3',
          data: '2026-03-13',
          quantidade: 100,
          precoEmCentavos: 62_00n,
        }),
      ]),
    ).toEqual(
      err({
        operacao: extrair(criarIdDeOperacao('op-002')),
        erro: {
          tipo: 'venda-a-descoberto',
          ticker: vale3,
          emCarteira: extrair(Quantidade.criar(400)),
          vendida: venda.quantidade,
        },
      }),
    );
  });

  it('recusa o lote com uma operação fora de ordem no meio', () => {
    expect(
      comTrezentasVale3().registrarTodas([
        umaCompra({
          id: 'op-001',
          ticker: 'VALE3',
          data: '2026-03-12',
          quantidade: 100,
          precoEmCentavos: 63_00n,
        }),
        umaCompra({
          id: 'op-002',
          ticker: 'VALE3',
          data: '2026-03-05',
          quantidade: 100,
          precoEmCentavos: 61_40n,
        }),
      ]),
    ).toEqual(
      err({
        operacao: extrair(criarIdDeOperacao('op-002')),
        erro: {
          tipo: 'operacao-fora-de-ordem',
          data: extrair(criarDataDePregao('2026-03-05')),
          ultimaData: extrair(criarDataDePregao('2026-03-12')),
        },
      }),
    );
  });

  it('deixa intacta a carteira original depois da falha', () => {
    const carteira = comTrezentasVale3();

    const resultado = carteira.registrarTodas([
      umaCompra({
        id: 'op-001',
        ticker: 'VALE3',
        data: '2026-03-05',
        quantidade: 100,
        precoEmCentavos: 61_40n,
      }),
      umaVenda({
        id: 'op-002',
        ticker: 'VALE3',
        data: '2026-03-12',
        quantidade: 1_000,
        precoEmCentavos: 63_00n,
      }),
    ]);

    expect(resultado.ok).toBe(false);
    expect(carteira.quantidadeDe(vale3)).toBe(300n);
  });

  it('aponta a primeira operação que falhou', () => {
    const resultado = comTrezentasVale3().registrarTodas([
      umaVenda({
        id: 'op-001',
        ticker: 'VALE3',
        data: '2026-03-05',
        quantidade: 400,
        precoEmCentavos: 63_00n,
      }),
      umaVenda({
        id: 'op-002',
        ticker: 'VALE3',
        data: '2026-03-06',
        quantidade: 500,
        precoEmCentavos: 63_00n,
      }),
    ]);

    expect(resultado).toMatchObject({
      ok: false,
      erro: { operacao: 'op-001' },
    });
  });
});
// #endregion

import { describe, expect, it } from 'vitest';

import {
  type OperacaoEmJson,
  todasDoJson,
} from '../../../src/adaptadores/http/entrada.js';
import { respostaDoErro } from '../../../src/adaptadores/http/erros.js';
import { dinheiroEmJson } from '../../../src/adaptadores/http/serializacao.js';
import { Dinheiro } from '../../../src/dominio/dinheiro.js';
import { err } from '../../../src/dominio/resultado.js';
import { extrair } from '../../apoio/resultado.js';
import { umaCompra, umaVenda } from '../../dominio/construtores.js';

const compra: OperacaoEmJson = {
  id: 'op-1',
  tipo: 'compra',
  data: '2026-04-02',
  ticker: 'PETR4',
  quantidade: 100,
  precoEmCentavos: '3000',
  custosEmCentavos: '745',
};

describe('Borda HTTP', () => {
  it.each([
    ['entrada-invalida', 400],
    ['operacao-repetida', 409],
    ['operacao-fora-de-ordem', 409],
    ['venda-a-descoberto', 422],
  ])('o erro %s vira o status %i, só com o tipo', (tipo, status) => {
    expect(
      respostaDoErro({ tipo, outro: 1n } as { tipo: string }),
    ).toEqual({ status, corpo: { tipo } });
  });

  it('escreve Dinheiro em centavos e em reais, sem bigint', () => {
    const json = dinheiroEmJson(
      Dinheiro.deCentavos(9_007_199_254_740_993n),
    );

    expect(JSON.stringify(json)).toBe(
      `{"centavos":"9007199254740993","reais":"${json.reais}"}`,
    );
  });

  it('traduz compra e venda do JSON para o domínio', () => {
    const venda = { ...compra, id: 'op-2', tipo: 'venda' } as const;

    expect(extrair(todasDoJson([compra, venda]))).toEqual([
      umaCompra(cenario('op-1')),
      umaVenda(cenario('op-2')),
    ]);
  });

  it.each([
    { id: '' },
    { data: '2026-02-30' },
    { ticker: 'petr4!' },
    { quantidade: 0 },
    { precoEmCentavos: '0' },
  ])('recusa %o com o id da operação', (campo) => {
    const ruim = { ...compra, ...campo };

    expect(todasDoJson([compra, ruim, compra])).toEqual(
      err({ tipo: 'entrada-invalida', operacao: ruim.id }),
    );
  });

  it('com duas inválidas, aponta a primeira', () => {
    const primeira = { ...compra, id: 'op-a', quantidade: -1 };
    const segunda = { ...compra, id: 'op-b', quantidade: -1 };

    expect(todasDoJson([primeira, segunda])).toEqual(
      err({ tipo: 'entrada-invalida', operacao: 'op-a' }),
    );
  });
});

function cenario(id: string) {
  return {
    id,
    data: '2026-04-02',
    quantidade: 100,
    precoEmCentavos: 30_00n,
    custosEmCentavos: 7_45n,
  };
}

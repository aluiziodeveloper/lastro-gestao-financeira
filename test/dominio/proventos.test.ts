import { describe, expect, it } from 'vitest';

import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  type Dividendo,
  type Provento,
  tratarProvento,
} from '../../src/dominio/proventos/provento.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { referenciasCom } from './referencias.js';

const referencias = referenciasCom(CatalogoDeAtivos.vazio());

function centavos(valor: bigint): Dinheiro {
  return Dinheiro.deCentavos(valor);
}

function umDividendo(pagamento: string, bruto: bigint): Dividendo {
  return {
    tipo: 'dividendo',
    ticker: extrair(Ticker.criar('VALE3')),
    pagamento: extrair(criarDataDoCalendario(pagamento)),
    bruto: centavos(bruto),
  };
}

// #region provento-dividendo-teste
describe('Proventos · dividendo', () => {
  it.each([
    ['2025-12-15', 'pela Lei 9.249/1995, art. 10'],
    ['2026-03-16', 'abaixo do limite da Lei 15.270/2025'],
  ])('paga em %s, é isento (%s)', (pagamento) => {
    const dividendo = umDividendo(pagamento, 1_500_00n);

    expect(tratarProvento(dividendo, referencias)).toEqual(
      ok({
        provento: dividendo,
        tratamento: 'isento',
        retido: centavos(0n),
        liquido: centavos(1_500_00n),
      }),
    );
  });

  it('pago antes de 2024, não tem lei conhecida', () => {
    const dividendo = umDividendo('2023-12-15', 1_500_00n);

    expect(tratarProvento(dividendo, referencias)).toEqual(
      err({ tipo: 'sem-regime-vigente', data: '2023-12-15' }),
    );
  });
});
// #endregion

describe('Proventos · dados que burlaram os tipos', () => {
  it('lança com um tipo de provento que a união não tem', () => {
    const intruso = {
      ...umDividendo('2026-03-16', 1_00n),
      tipo: 'bonificacao',
    } as unknown as Provento;

    expect(() => tratarProvento(intruso, referencias)).toThrow(
      'Caso não tratado: "bonificacao"',
    );
  });
});

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { Carteira } from '../../src/dominio/carteira.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra } from '../dominio/construtores.js';
import { eventoCom, termosDeEvento } from './geradores.js';

const vale3 = extrair(Ticker.criar('VALE3'));

function carteiraCom(quantidade: number): Carteira {
  return extrair(
    Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))).registrar(
      umaCompra({
        ticker: 'VALE3',
        data: '2026-01-02',
        quantidade,
        precoEmCentavos: 61_40n,
      }),
    ),
  );
}

const umaPosicao = fc.integer({ min: 1, max: 1_000 });

describe('R3 · propriedades dos eventos', () => {
  // #region prop-quantidade-conservada
  // Antes e depois do evento, a carteira tem a mesma fatia da empresa:
  // quantidade × para = quantidade nova × de. Marcada com it.fails até
  // a correção das frações: hoje a propriedade falha, e a suíte sabe.
  it.fails('não faz sumir nenhuma ação', () => {
    fc.assert(
      fc.property(umaPosicao, termosDeEvento, (quantidade, termos) => {
        const evento = eventoCom(vale3, termos);
        const depois = extrair(carteiraCom(quantidade).aplicar(evento));
        expect(depois.quantidadeDe(vale3) * BigInt(termos.de)).toBe(
          BigInt(quantidade) * BigInt(termos.para),
        );
      }),
    );
  });
  // #endregion
});

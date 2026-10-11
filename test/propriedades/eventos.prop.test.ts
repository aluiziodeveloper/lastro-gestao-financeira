import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { Carteira } from '../../src/dominio/carteira.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra } from '../dominio/construtores.js';
import { eventoCom, type Termos, termosDeEvento } from './geradores.js';

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

// #region contraexemplos-obrigatorios
// Os contraexemplos que já derrubaram estas propriedades rodam
// sempre, antes dos casos gerados: o menor que o encolhimento achou e
// o da cena.
const contraexemplos: [number, Termos][] = [
  [1, { de: 2, para: 1 }],
  [15, { de: 10, para: 1 }],
];
// #endregion

describe('R3 · propriedades dos eventos', () => {
  // #region prop-quantidade-conservada
  // Antes e depois do evento, a carteira tem a mesma fatia da empresa:
  // quantidade × para = ações novas × de + o que sobrou em fração.
  it('não faz sumir nenhuma ação', () => {
    fc.assert(
      fc.property(umaPosicao, termosDeEvento, (quantidade, termos) => {
        const evento = eventoCom(vale3, termos);
        const depois = extrair(carteiraCom(quantidade).aplicar(evento));
        const sobra = depois
          .fracoesPendentesDe(vale3)
          .reduce((soma, fracao) => soma + fracao.numerador(), 0n);
        expect(
          depois.quantidadeDe(vale3) * BigInt(termos.de) + sobra,
        ).toBe(BigInt(quantidade) * BigInt(termos.para));
      }),
      { examples: contraexemplos },
    );
  });
  // #endregion

  // #region prop-custo-conservado
  // O evento não compra nem vende: o custo das ações que ficam e o das
  // frações somam o custo de antes.
  it('conserva o custo total, somando o das frações', () => {
    fc.assert(
      fc.property(umaPosicao, termosDeEvento, (quantidade, termos) => {
        const antes = carteiraCom(quantidade);
        const depois = extrair(antes.aplicar(eventoCom(vale3, termos)));
        const total = depois
          .fracoesPendentesDe(vale3)
          .reduce(
            (soma, fracao) => soma.somar(fracao.custo()),
            depois.custoTotalDe(vale3),
          );
        expect(total).toEqual(antes.custoTotalDe(vale3));
      }),
      { examples: contraexemplos },
    );
  });
  // #endregion
});

import fc from 'fast-check';
import { expect, it } from 'vitest';

import { Carteira } from '../../src/dominio/carteira.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../../test/apoio/resultado.js';
import { umaCompra } from '../../test/dominio/construtores.js';
import {
  eventoCom,
  termosDeEvento,
} from '../../test/propriedades/geradores.js';

const vale3 = extrair(Ticker.criar('VALE3'));

// #region propriedade-tautologica
// A propriedade que refaz a conta do código: multiplica, divide e
// trunca como Proporcao.aplicadaA. Passa com a correção do Capítulo 7
// e passava sem ela, quando a meia ação sumia; não verifica regra
// nenhuma, só repete a implementação.
it('confere as ações novas com a mesma conta do código', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 1_000 }),
      termosDeEvento,
      (quantidade, termos) => {
        const carteira = extrair(
          Carteira.abrir(extrair(criarIdDeCarteira('c-1'))).registrar(
            umaCompra({
              ticker: 'VALE3',
              data: '2026-01-02',
              quantidade,
              precoEmCentavos: 61_40n,
            }),
          ),
        );
        const depois = carteira.aplicar(eventoCom(vale3, termos));
        const esperado =
          (BigInt(quantidade) * BigInt(termos.para)) /
          BigInt(termos.de);
        if (depois.ok) {
          expect(depois.valor.quantidadeDe(vale3)).toBe(esperado);
        }
      },
    ),
  );
});
// #endregion

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Totais } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { categoriasDoMes } from '../../src/dominio/apuracao/categorias.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';

const umValor = (min: bigint, max: bigint) =>
  fc
    .bigInt({ min, max })
    .map((centavos) => Dinheiro.deCentavos(centavos));

const semGanho = umValor(-50_000_00n, 0n);
const umGanho = umValor(1n, 50_000_00n);

const umTotal: fc.Arbitrary<Totais> = fc.record({
  totalVendido: umValor(0n, 100_000_00n),
  resultado: umValor(-50_000_00n, 50_000_00n),
});

// #region contrato-das-categorias
// O contrato que toda categoria cumpre. A mesma suíte roda para as
// quatro: quem apura pode trocar uma pela outra sem surpresa.
describe.each(categoriasDoMes)(
  'contrato da categoria $nome',
  (categoria) => {
    it('devolve o próprio nome e os totais que recebeu', () => {
      fc.assert(
        fc.property(umTotal, (totais) => {
          const apurado = categoria.apurar(totais);
          expect(apurado.categoria).toBe(categoria.nome);
          expect(apurado.totalVendido).toEqual(totais.totalVendido);
          expect(apurado.resultado).toEqual(totais.resultado);
        }),
      );
    });

    it('nunca cobra imposto negativo', () => {
      fc.assert(
        fc.property(umTotal, (totais) => {
          expect(categoria.apurar(totais).imposto.ehNegativo()).toBe(
            false,
          );
        }),
      );
    });

    it('não cobra imposto quando não há ganho', () => {
      fc.assert(
        fc.property(
          umValor(0n, 100_000_00n),
          semGanho,
          (totalVendido, resultado) => {
            const { imposto } = categoria.apurar({
              totalVendido,
              resultado,
            });
            expect(imposto).toEqual(Dinheiro.deCentavos(0n));
          },
        ),
      );
    });

    it('nunca cobra mais do que o ganho', () => {
      fc.assert(
        fc.property(
          umValor(0n, 100_000_00n),
          umGanho,
          (totalVendido, resultado) => {
            const { imposto } = categoria.apurar({
              totalVendido,
              resultado,
            });
            expect(imposto.excede(resultado)).toBe(false);
          },
        ),
      );
    });

    it('não cobra menos quando o resultado cresce', () => {
      fc.assert(
        fc.property(
          umValor(0n, 100_000_00n),
          umValor(-50_000_00n, 50_000_00n),
          umValor(0n, 50_000_00n),
          (totalVendido, resultado, acrescimo) => {
            const menor = categoria.apurar({ totalVendido, resultado });
            const maior = categoria.apurar({
              totalVendido,
              resultado: resultado.somar(acrescimo),
            });
            expect(menor.imposto.excede(maior.imposto)).toBe(false);
          },
        ),
      );
    });
  },
);
// #endregion

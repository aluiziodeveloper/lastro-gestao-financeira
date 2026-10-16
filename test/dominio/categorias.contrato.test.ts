import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Totais } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { categoriasDo } from '../../src/dominio/apuracao/categorias.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  grupoDaCategoria,
  PrejuizoAcumulado,
} from '../../src/dominio/prejuizo/prejuizo-acumulado.js';
import { regrasEm } from './referencias.js';

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

// Um prejuízo a compensar em cada grupo, de zero a R$ 50 mil.
const umPrejuizo = fc
  .tuple(
    umValor(0n, 50_000_00n),
    umValor(0n, 50_000_00n),
    umValor(0n, 50_000_00n),
  )
  .map(([comum, dayTrade, fii]) =>
    PrejuizoAcumulado.nenhum()
      .acumular('comum', Dinheiro.deCentavos(0n).subtrair(comum))
      .acumular('day-trade', Dinheiro.deCentavos(0n).subtrair(dayTrade))
      .acumular('fii', Dinheiro.deCentavos(0n).subtrair(fii)),
  );

// #region contrato-das-categorias
// O contrato que toda categoria cumpre, com qualquer prejuízo a
// compensar. A mesma suíte roda para as quatro: quem apura pode
// trocar uma pela outra sem surpresa.
describe.each(categoriasDo(regrasEm('2026-01-01')))(
  'contrato da categoria $nome',
  (categoria) => {
    it('devolve o próprio nome e os totais que recebeu', () => {
      fc.assert(
        fc.property(umTotal, umPrejuizo, (totais, prejuizo) => {
          const { apurado } = categoria.apurar(totais, prejuizo);
          expect(apurado.categoria).toBe(categoria.nome);
          expect(apurado.totalVendido).toEqual(totais.totalVendido);
          expect(apurado.resultado).toEqual(totais.resultado);
        }),
      );
    });

    it('nunca cobra imposto negativo', () => {
      fc.assert(
        fc.property(umTotal, umPrejuizo, (totais, prejuizo) => {
          const { apurado } = categoria.apurar(totais, prejuizo);
          expect(apurado.imposto.ehNegativo()).toBe(false);
        }),
      );
    });

    it('não cobra imposto quando não há ganho', () => {
      fc.assert(
        fc.property(
          umValor(0n, 100_000_00n),
          semGanho,
          umPrejuizo,
          (totalVendido, resultado, prejuizo) => {
            const { apurado } = categoria.apurar(
              { totalVendido, resultado },
              prejuizo,
            );
            expect(apurado.imposto).toEqual(Dinheiro.deCentavos(0n));
          },
        ),
      );
    });

    it('nunca cobra mais do que o ganho', () => {
      fc.assert(
        fc.property(
          umValor(0n, 100_000_00n),
          umGanho,
          umPrejuizo,
          (totalVendido, resultado, prejuizo) => {
            const { apurado } = categoria.apurar(
              { totalVendido, resultado },
              prejuizo,
            );
            expect(apurado.imposto.excede(resultado)).toBe(false);
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
          umPrejuizo,
          (totalVendido, resultado, acrescimo, prejuizo) => {
            const menor = categoria.apurar(
              { totalVendido, resultado },
              prejuizo,
            ).apurado;
            const maior = categoria.apurar(
              { totalVendido, resultado: resultado.somar(acrescimo) },
              prejuizo,
            ).apurado;
            expect(menor.imposto.excede(maior.imposto)).toBe(false);
          },
        ),
      );
    });

    it('compensa até o ganho, sem criar nem perder saldo', () => {
      const grupo = grupoDaCategoria[categoria.nome];
      fc.assert(
        fc.property(umTotal, umPrejuizo, (totais, anterior) => {
          const { apurado, prejuizo } = categoria.apurar(
            totais,
            anterior,
          );
          const ganho = totais.resultado.ehPositivo()
            ? totais.resultado
            : Dinheiro.deCentavos(0n);
          expect(apurado.compensado.excede(ganho)).toBe(false);
          expect(
            prejuizo.saldoDe(grupo).somar(apurado.compensado),
          ).toEqual(anterior.saldoDe(grupo));
        }),
      );
    });
  },
);
// #endregion

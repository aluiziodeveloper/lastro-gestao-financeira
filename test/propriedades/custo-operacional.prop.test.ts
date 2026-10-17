import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Composicao } from '../../src/dominio/alocacao/composicao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  cemPorCento,
  pontosBase,
} from '../../src/dominio/mercado/pontos-base.js';
import { rebalancearComCusto } from '../../src/dominio/rebalanceamento/custo-operacional.js';
import { rebalancear } from '../../src/dominio/rebalanceamento/rebalanceamento.js';
import { totalDe } from '../../src/dominio/rebalanceamento/sugestao.js';
import {
  alocacaoDaCena,
  representantesDaCena,
} from '../dominio/carteira-desenquadrada.js';

const reais = (centavos: bigint): Dinheiro =>
  Dinheiro.deCentavos(centavos);

// A carteira, o dinheiro e o custo sorteados em centavos; o alvo e os
// representantes são os da cena.
const umCaso = fc.record({
  acao: fc.bigInt({ min: 0n, max: 500_000_00n }),
  fii: fc.bigInt({ min: 0n, max: 500_000_00n }),
  aporte: fc.bigInt({ min: 0n, max: 50_000_00n }),
  margem: fc.bigInt({ min: 0n, max: 20_000_00n }),
  porOrdem: fc.bigInt({ min: 0n, max: 50_00n }),
  limite: fc.bigInt({ min: 0n, max: 100n }),
});

type Caso = typeof umCaso extends fc.Arbitrary<infer T> ? T : never;

function sugerir(caso: Caso, comCusto = true) {
  const composicao: Composicao = {
    total: reais(caso.acao + caso.fii),
    porClasse: {
      acao: reais(caso.acao),
      fii: reais(caso.fii),
      etf: reais(0n),
    },
  };
  const recursos = {
    aporte: reais(caso.aporte),
    margem: reais(caso.margem),
  };
  const custo = {
    porOrdem: reais(caso.porOrdem),
    limite: pontosBase(caso.limite),
  };
  return comCusto
    ? rebalancearComCusto(
        composicao,
        alocacaoDaCena,
        recursos,
        representantesDaCena,
        custo,
      )
    : rebalancear(
        composicao,
        alocacaoDaCena,
        recursos,
        representantesDaCena,
      );
}

describe('Desafio · propriedades do custo operacional', () => {
  it('nenhuma ordem que sobra custa mais que o limite', () => {
    fc.assert(
      fc.property(umCaso, (caso) => {
        for (const { valor } of sugerir(caso).ordens) {
          const custo = reais(caso.porOrdem).multiplicarPorUnidades(
            cemPorCento,
          );
          const limite = valor.multiplicarPorUnidades(caso.limite);
          expect(custo.excede(limite)).toBe(false);
        }
      }),
    );
  });

  it('conserva o dinheiro: aporte e vendas viram compras e caixa', () => {
    fc.assert(
      fc.property(umCaso, (caso) => {
        const sugestao = sugerir(caso);

        expect(totalDe(sugestao.compras).somar(sugestao.caixa)).toEqual(
          reais(caso.aporte).somar(totalDe(sugestao.vendas)),
        );
      }),
    );
  });

  it('sem custo, a sugestão é a do Lastro', () => {
    fc.assert(
      fc.property(umCaso, (caso) => {
        const semCusto = { ...caso, porOrdem: 0n };

        expect(sugerir(semCusto)).toEqual(sugerir(semCusto, false));
      }),
    );
  });
});

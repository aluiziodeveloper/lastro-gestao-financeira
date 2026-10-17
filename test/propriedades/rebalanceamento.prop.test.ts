import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { AlocacaoAlvo } from '../../src/dominio/alocacao/alocacao-alvo.js';
import type { Composicao } from '../../src/dominio/alocacao/composicao.js';
import { classesDeAtivo } from '../../src/dominio/classe-de-ativo.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { pontosBase } from '../../src/dominio/mercado/pontos-base.js';
import { rebalancear } from '../../src/dominio/rebalanceamento/rebalanceamento.js';
import {
  type Sugestao,
  totalDe,
} from '../../src/dominio/rebalanceamento/sugestao.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';

const reais = (centavos: bigint): Dinheiro =>
  Dinheiro.deCentavos(centavos);
const centavosDe = (valor: Dinheiro): bigint =>
  valor.razaoSobre(reais(1n), 1n, 'truncar');

// Uma situação sorteada em centavos: o valor de cada classe, o alvo e
// a banda das ações e do FII, o aporte, a margem e os preços dos
// representantes. Tudo nasce dentro da propriedade (Capítulo 7).
const umaSituacao = fc.record({
  acao: fc.bigInt({ min: 0n, max: 1_000_000_00n }),
  fii: fc.bigInt({ min: 0n, max: 1_000_000_00n }),
  etf: fc.bigInt({ min: 0n, max: 100_000_00n }),
  alvoDasAcoes: fc.bigInt({ min: 0n, max: 10_000n }),
  banda: fc.bigInt({ min: 0n, max: 1_000n }),
  aporte: fc.bigInt({ min: 0n, max: 50_000_00n }),
  margem: fc.bigInt({ min: 0n, max: 20_000_00n }),
  precoDaAcao: fc.bigInt({ min: 1n, max: 500_00n }),
  precoDoFii: fc.bigInt({ min: 1n, max: 500_00n }),
});

type Sorteio =
  typeof umaSituacao extends fc.Arbitrary<infer T> ? T : never;

function montar(s: Sorteio) {
  const alvoDoFii = 10_000n - s.alvoDasAcoes;
  const banda = (alvo: bigint) => (s.banda > alvo ? alvo : s.banda);
  const composicao: Composicao = {
    total: reais(s.acao + s.fii + s.etf),
    porClasse: {
      acao: reais(s.acao),
      fii: reais(s.fii),
      etf: reais(s.etf),
    },
  };
  const alocacao = extrair(
    AlocacaoAlvo.criar([
      {
        classe: 'acao',
        alvo: pontosBase(s.alvoDasAcoes),
        banda: pontosBase(banda(s.alvoDasAcoes)),
      },
      {
        classe: 'fii',
        alvo: pontosBase(alvoDoFii),
        banda: pontosBase(banda(alvoDoFii)),
      },
    ]),
  );
  const recursos = { aporte: reais(s.aporte), margem: reais(s.margem) };
  const representantes = {
    acao: {
      ticker: extrair(Ticker.criar('ITUB4')),
      preco: reais(s.precoDaAcao),
    },
    fii: {
      ticker: extrair(Ticker.criar('HGLG11')),
      preco: reais(s.precoDoFii),
    },
  };
  const sugestao = rebalancear(
    composicao,
    alocacao,
    recursos,
    representantes,
  );
  return { composicao, alocacao, recursos, representantes, sugestao };
}

// A carteira depois de seguir a sugestão: compra e venda por classe.
function aplicar(
  composicao: Composicao,
  sugestao: Sugestao,
): Composicao {
  const valor = (classe: (typeof classesDeAtivo)[number]) =>
    composicao.porClasse[classe]
      .somar(sugestao.compras[classe])
      .subtrair(sugestao.vendas[classe]);
  const porClasse = {
    acao: valor('acao'),
    fii: valor('fii'),
    etf: valor('etf'),
  };
  return { total: totalDe(porClasse), porClasse };
}

// A distância ao alvo, em centavos × pontos-base, sobre o patrimônio
// (as classes e o caixa), que a sugestão não muda: a soma, classe a
// classe, de |valor × 10.000 − alvo × patrimônio|.
function distancia(
  composicao: Composicao,
  alocacao: AlocacaoAlvo,
  patrimonio: bigint,
): bigint {
  return classesDeAtivo.reduce((soma, classe) => {
    const desvio =
      centavosDe(composicao.porClasse[classe]) * 10_000n -
      alocacao.fatiaDe(classe).alvo * patrimonio;
    return soma + (desvio < 0n ? -desvio : desvio);
  }, 0n);
}

describe('Propriedades de uma sugestão', () => {
  // #region prop-nao-piora
  it('não piora: a distância ao alvo não aumenta', () => {
    fc.assert(
      fc.property(umaSituacao, (s) => {
        const { composicao, alocacao, sugestao } = montar(s);
        const patrimonio = s.acao + s.fii + s.etf + s.aporte;

        const depois = aplicar(composicao, sugestao);

        expect(
          distancia(depois, alocacao, patrimonio),
        ).toBeLessThanOrEqual(
          distancia(composicao, alocacao, patrimonio),
        );
      }),
    );
  });
  // #endregion

  // #region prop-margem
  it('respeita a margem: só vende ações, e nunca além dela', () => {
    fc.assert(
      fc.property(umaSituacao, (s) => {
        const { sugestao } = montar(s);

        expect(centavosDe(sugestao.vendas.acao)).toBeLessThanOrEqual(
          s.margem,
        );
        expect(totalDe(sugestao.vendas)).toEqual(sugestao.vendas.acao);
      }),
    );
  });
  // #endregion

  it('conserva o dinheiro: aporte e vendas viram compras e caixa', () => {
    fc.assert(
      fc.property(umaSituacao, (s) => {
        const { sugestao } = montar(s);

        expect(totalDe(sugestao.compras).somar(sugestao.caixa)).toEqual(
          reais(s.aporte).somar(totalDe(sugestao.vendas)),
        );
      }),
    );
  });

  // O caixa que sobrou continua da investidora: a rodada seguinte o
  // recebe como aporte. Dinheiro novo, não há.
  it('é idempotente: seguida a sugestão, sem dinheiro novo, nada a fazer', () => {
    fc.assert(
      fc.property(umaSituacao, (s) => {
        const {
          composicao,
          alocacao,
          recursos,
          representantes,
          sugestao,
        } = montar(s);
        const depois = aplicar(composicao, sugestao);
        const margem = recursos.margem.subtrair(sugestao.vendas.acao);

        const seguinte = rebalancear(
          depois,
          alocacao,
          { aporte: sugestao.caixa, margem },
          representantes,
        );

        expect(seguinte.ordens).toEqual([]);
      }),
      { numRuns: 1_000 },
    );
  });
});

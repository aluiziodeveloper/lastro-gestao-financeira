import { describe, expect, it } from 'vitest';

import type { MovimentoDoMes } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { apurarMeses } from '../../src/dominio/apuracao/apuracao-dos-meses.js';
import { estadoInicial } from '../../src/dominio/apuracao/estado-da-apuracao.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { PrejuizoAcumulado } from '../../src/dominio/prejuizo/prejuizo-acumulado.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes, referenciasCom } from './referencias.js';

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

const referencias = referenciasCom(
  CatalogoDeAtivos.vazio()
    .com(extrair(Ticker.criar('ITUB4')), 'acao')
    .com(extrair(Ticker.criar('PETR4')), 'acao'),
);

const inicial = estadoInicial(
  Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))),
);

// Janeiro: R$ 28.000,00 vendidos com R$ 2.000,00 de prejuízo.
const janeiro: MovimentoDoMes = {
  mes: mes('2026-01'),
  operacoes: [
    umaCompra({
      ticker: 'ITUB4',
      data: '2026-01-05',
      quantidade: 2_000,
      precoEmCentavos: 15_00n,
    }),
    umaVenda({
      ticker: 'ITUB4',
      data: '2026-01-20',
      quantidade: 2_000,
      precoEmCentavos: 14_00n,
    }),
  ],
  retencoes: [],
};

// Fevereiro: nenhuma operação.
const fevereiro: MovimentoDoMes = {
  mes: mes('2026-02'),
  operacoes: [],
  retencoes: [],
};

// Março: R$ 28.000,00 vendidos com R$ 3.000,00 de lucro.
const marco: MovimentoDoMes = {
  mes: mes('2026-03'),
  operacoes: [
    umaCompra({
      ticker: 'PETR4',
      data: '2026-03-02',
      quantidade: 1_000,
      precoEmCentavos: 25_00n,
    }),
    umaVenda({
      ticker: 'PETR4',
      data: '2026-03-20',
      quantidade: 1_000,
      precoEmCentavos: 28_00n,
    }),
  ],
  retencoes: [],
};

// #region dobra-dos-meses-teste
describe('A dobra sobre os meses', () => {
  const trimestre = extrair(
    apurarMeses([janeiro, fevereiro, marco], inicial, referencias),
  );
  const [, depoisDeFevereiro, depoisDeMarco] = trimestre.apuracoes;

  it('o mês sem operação leva o prejuízo de janeiro adiante', () => {
    expect(depoisDeFevereiro?.estado.prejuizo.saldoDe('comum')).toEqual(
      reais(2_000_00n),
    );
  });

  it('março compensa o prejuízo de janeiro: R$ 150,00', () => {
    const [acoes] = depoisDeMarco?.categorias ?? [];

    expect(acoes?.compensado).toEqual(reais(2_000_00n));
    expect(acoes?.imposto).toEqual(reais(150_00n));
    expect(trimestre.estado.prejuizo).toEqual(
      PrejuizoAcumulado.nenhum(),
    );
  });

  it('cada apuração diz o mês, e o estado final é o do último', () => {
    expect(trimestre.apuracoes.map((apuracao) => apuracao.mes)).toEqual(
      [mes('2026-01'), mes('2026-02'), mes('2026-03')],
    );
    expect(trimestre.estado).toBe(depoisDeMarco?.estado);
    expect(trimestre.estado.apuradoAte).toEqual(mes('2026-03'));
  });

  it('o estado inicial continua o mesmo', () => {
    expect(inicial.prejuizo).toEqual(PrejuizoAcumulado.nenhum());
    expect(inicial.apuradoAte).toBeUndefined();
  });
});
// #endregion

describe('A dobra sobre os meses: sequência', () => {
  it('recusa um mês depois de uma lacuna', () => {
    expect(apurarMeses([janeiro, marco], inicial, referencias)).toEqual(
      err({
        tipo: 'meses-fora-de-sequencia',
        apuradoAte: mes('2026-01'),
        mes: mes('2026-03'),
      }),
    );
  });

  it('recusa o mesmo mês duas vezes', () => {
    expect(
      apurarMeses([janeiro, janeiro], inicial, referencias),
    ).toEqual(
      err({
        tipo: 'meses-fora-de-sequencia',
        apuradoAte: mes('2026-01'),
        mes: mes('2026-01'),
      }),
    );
  });

  it('sem meses, devolve o estado inicial', () => {
    expect(apurarMeses([], inicial, referencias)).toEqual(
      ok({ apuracoes: [], estado: inicial }),
    );
  });
});

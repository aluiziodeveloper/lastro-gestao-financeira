import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { projetarRenda } from '../../src/dominio/projecao/renda-projetada.js';
import {
  maisDoDobroDaMediana,
  projetarSemExtraordinarios,
} from '../../src/dominio/projecao/sem-extraordinarios.js';
import type { Provento } from '../../src/dominio/proventos/provento.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import {
  carteiraDaTabela,
  data,
  proventosDaTabela,
} from './carteira-de-renda.js';
import { mes } from './referencias.js';

const outubro = mes('2026-10');

// Um dividendo da PETR4 em abril de 2026, fora do calendário de
// dezembro, março, junho e setembro, para as 400 ações.
function dividendoDeAbril(porAcao: bigint): Provento {
  return {
    tipo: 'dividendo',
    ticker: extrair(Ticker.criar('PETR4')),
    pagamento: data('2026-04-20'),
    bruto: Dinheiro.deCentavos(400n * porAcao),
    quantidade: extrair(Quantidade.criar(400)),
    anoDoLucro: 2025,
    aprovacao: data('2026-04-01'),
  };
}

function jcpDeItub4(pagamento: string, bruto: bigint): Provento {
  return {
    tipo: 'jcp',
    ticker: extrair(Ticker.criar('ITUB4')),
    pagamento: data(pagamento),
    bruto: Dinheiro.deCentavos(bruto),
    quantidade: extrair(Quantidade.criar(500)),
  };
}

function semExtraordinarios(proventos: readonly Provento[]): string {
  return projetarSemExtraordinarios(
    proventos,
    carteiraDaTabela,
    outubro,
    maisDoDobroDaMediana,
  ).total.emReais();
}

// #region sem-extraordinarios-teste
describe('Desafio · proventos extraordinários', () => {
  it('tira da projeção o dividendo de R$ 2,00 por ação', () => {
    const proventos = [...proventosDaTabela, dividendoDeAbril(2_00n)];

    const comTodos = projetarRenda(
      proventos,
      carteiraDaTabela,
      outubro,
    );

    expect(comTodos.total.emReais()).toBe('R$ 4.100,00');
    expect(semExtraordinarios(proventos)).toBe('R$ 3.300,00');
  });

  it.each([
    ['R$ 1,50', 'R$ 3.900,00', 'o dobro exato fica', 1_50n],
    ['R$ 1,51', 'R$ 3.300,00', 'um centavo acima sai', 1_51n],
  ])(
    'mediana de R$ 0,75, %s por ação: %s (%s)',
    (_, esperado, _nota, porAcao) => {
      const proventos = [
        ...proventosDaTabela,
        dividendoDeAbril(porAcao),
      ];

      expect(semExtraordinarios(proventos)).toBe(esperado);
    },
  );

  it('compara o valor por unidade, e não o bruto', () => {
    expect(semExtraordinarios(proventosDaTabela)).toBe('R$ 3.300,00');
  });

  it('um provento sem outros do mesmo ativo fica', () => {
    const sozinho = [dividendoDeAbril(2_00n)];

    expect(semExtraordinarios(sozinho)).toBe('R$ 800,00');
  });

  it.each([
    ['o dobro exato fica', 'R$ 40,00', 20_00n],
    ['um centavo acima sai', 'R$ 20,00', 20_01n],
  ])(
    'dois outros, mediana de R$ 0,02, a média do meio: %s, %s',
    (_, esperado, bruto) => {
      const proventos = [
        jcpDeItub4('2026-01-02', 5_00n),
        jcpDeItub4('2026-02-02', 15_00n),
        jcpDeItub4('2026-03-02', bruto),
      ];

      expect(semExtraordinarios(proventos)).toBe(esperado);
    },
  );
});
// #endregion

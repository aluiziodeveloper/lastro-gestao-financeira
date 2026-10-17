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
    const proventos = [
      dividendoDeAbril(2_00n),
      jcpDeItub4('2026-03-02', 10_00n),
    ];

    expect(semExtraordinarios(proventos)).toBe('R$ 810,00');
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

  // Os três outros valem R$ 0,01, R$ 0,03 e R$ 0,05 por ação, em
  // várias ordens de pagamento; R$ 0,062 só passa do dobro da mediana
  // certa, R$ 0,03.
  it.each([
    ['1, 3, 5', 5_00n, 15_00n, 25_00n],
    ['5, 1, 3', 25_00n, 5_00n, 15_00n],
    ['3, 5, 1', 15_00n, 25_00n, 5_00n],
    ['5, 3, 1', 25_00n, 15_00n, 5_00n],
  ])(
    'três outros, na ordem %s centavos: a mediana é o do meio',
    (_, primeiro, segundo, terceiro) => {
      const proventos = [
        jcpDeItub4('2026-01-02', primeiro),
        jcpDeItub4('2026-02-02', segundo),
        jcpDeItub4('2026-03-02', terceiro),
        jcpDeItub4('2026-04-01', 31_00n),
      ];

      expect(semExtraordinarios(proventos)).toBe('R$ 45,00');
    },
  );

  it('os proventos fora da janela não entram na mediana', () => {
    const antigos = ['01', '02', '03', '04', '05'].map((mes) => ({
      ...dividendoDeAbril(2_00n),
      pagamento: data(`2025-${mes}-20`),
    }));
    const proventos = [
      ...proventosDaTabela,
      ...antigos,
      dividendoDeAbril(1_51n),
    ];

    expect(semExtraordinarios(proventos)).toBe('R$ 3.300,00');
  });
});
// #endregion

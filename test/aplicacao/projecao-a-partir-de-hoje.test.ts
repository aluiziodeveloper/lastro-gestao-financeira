import { describe, expect, it } from 'vitest';

import { projecaoAPartirDeHoje } from '../../src/aplicacao/projecao-a-partir-de-hoje.js';
import { relogioFixo } from '../apoio/relogio-fixo.js';
import {
  carteiraDaTabela,
  proventosDaTabela,
} from '../dominio/carteira-de-renda.js';
import { mes } from '../dominio/referencias.js';

// #region caso-de-uso-teste
describe('Projeção a partir de hoje', () => {
  it('em 31/10/2026, projeta de novembro a outubro', () => {
    const relogio = relogioFixo('2026-10-31T15:00:00Z');

    const renda = projecaoAPartirDeHoje(
      relogio,
      proventosDaTabela,
      carteiraDaTabela,
    );

    expect(renda.meses[0]?.mes).toEqual(mes('2026-11'));
    expect(renda.meses.at(-1)?.mes).toEqual(mes('2027-10'));
    expect(renda.total.emReais()).toBe('R$ 3.300,00');
  });

  it('o mês corrente vem do relógio recebido, e só dele', () => {
    const relogio = relogioFixo('2027-03-10T15:00:00Z');

    const renda = projecaoAPartirDeHoje(
      relogio,
      proventosDaTabela,
      carteiraDaTabela,
    );

    expect(renda.meses[0]?.mes).toEqual(mes('2027-04'));
  });
});
// #endregion

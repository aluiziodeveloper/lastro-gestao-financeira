import { describe, expect, it } from 'vitest';

import { composicaoDe } from '../../src/dominio/alocacao/composicao.js';
import { desenquadramentos } from '../../src/dominio/alocacao/desenquadramento.js';
import { extrair } from '../apoio/resultado.js';
import {
  alocacaoDaCena,
  carteiraDaCena,
  catalogoDaCena,
  cotacoesDaCena,
} from '../dominio/carteira-desenquadrada.js';

// #region especificacao-regras
describe('R10 · prejuízo acumulado · Capítulo 11', () => {
  it.todo('compensa prejuízo apenas no mesmo grupo de compensação');
});

describe('R11 · DARF · Capítulo 11', () => {
  it.todo('transfere ao mês seguinte o DARF abaixo do valor mínimo');
});

describe('R12 · enquadramento · Capítulo 13', () => {
  it('alerta a classe de ativo fora da banda de tolerância', () => {
    const composicao = extrair(
      composicaoDe(carteiraDaCena, cotacoesDaCena, catalogoDaCena),
    );

    expect(
      desenquadramentos(composicao, alocacaoDaCena).map(
        ({ classe, direcao }) => `${classe} ${direcao}`,
      ),
    ).toEqual(['acao acima', 'fii abaixo']);
  });
});
// #endregion

import { describe, expect, it } from 'vitest';

import type { Composicao } from '../../src/dominio/alocacao/composicao.js';
import { desenquadramentos } from '../../src/dominio/alocacao/desenquadramento.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { rebalancear } from '../../src/dominio/rebalanceamento/rebalanceamento.js';
import {
  alocacaoDaCena,
  representantesDaCena,
} from './carteira-desenquadrada.js';

const reais = (centavos: bigint): Dinheiro =>
  Dinheiro.deCentavos(centavos);

function composicao(acao: bigint, fii: bigint): Composicao {
  return {
    total: reais(acao + fii),
    porClasse: { acao: reais(acao), fii: reais(fii), etf: reais(0n) },
  };
}

// #region sem-sugestao
// Uma sugestão sem ordens é uma resposta, e não um erro: diz que, com
// estes recursos, não há o que fazer. Os alertas continuam valendo.
describe('Quando nenhuma sugestão é possível', () => {
  it.each([
    ['dentro da banda, sem aporte', 54_000_00n, 46_000_00n, 17_000_00n],
    [
      'fora da banda, com a margem esgotada',
      132_000_00n,
      80_000_00n,
      0n,
    ],
  ])('%s: nenhuma ordem', (_, acao, fii, margem) => {
    const sugestao = rebalancear(
      composicao(acao, fii),
      alocacaoDaCena,
      { aporte: reais(0n), margem: reais(margem) },
      representantesDaCena,
    );

    expect(sugestao.ordens).toEqual([]);
    expect(sugestao.caixa).toEqual(reais(0n));
  });

  it('com a margem esgotada, o alerta continua lá', () => {
    const daCena = composicao(132_000_00n, 80_000_00n);

    expect(
      desenquadramentos(daCena, alocacaoDaCena).map(
        ({ classe }) => classe,
      ),
    ).toEqual(['acao', 'fii']);
  });
});
// #endregion

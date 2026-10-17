import type { AlocacaoAlvo } from '../alocacao/alocacao-alvo.js';
import type { Composicao } from '../alocacao/composicao.js';
import type { Dinheiro } from '../dinheiro.js';
import type { PontosBase } from '../mercado/pontos-base.js';
import type {
  PoliticaDeRebalanceamento,
  Recursos,
  Representantes,
} from './politica.js';
import type { Sugestao } from './sugestao.js';

// O custo de executar uma ordem, fixo, e o limite que ele pode ter em
// relação ao valor da ordem, em pontos-base.
export interface CustoOperacional {
  readonly porOrdem: Dinheiro;
  readonly limite: PontosBase;
}

/* eslint-disable @typescript-eslint/no-unused-vars -- esboço */
// #region custo-operacional
// Desafio do Capítulo 13: uma política que descarta as ordens cujo
// custo passa do limite, composta às do Lastro sem mudá-las. Os testes
// estão em test/dominio/custo-operacional.test.ts e em
// test/propriedades/custo-operacional.prop.test.ts.
export function semOrdensCaras(
  custo: CustoOperacional,
): PoliticaDeRebalanceamento {
  throw new Error('Desafio do Capítulo 13 não resolvido');
}

export function rebalancearComCusto(
  composicao: Composicao,
  alocacao: AlocacaoAlvo,
  recursos: Recursos,
  representantes: Representantes,
  custo: CustoOperacional,
): Sugestao {
  throw new Error('Desafio do Capítulo 13 não resolvido');
}
// #endregion
/* eslint-enable @typescript-eslint/no-unused-vars */

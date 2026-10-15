import type { CatalogoDeAtivos } from '../ativo.js';
import type { Dinheiro } from '../dinheiro.js';
import type { Operacao } from '../operacao.js';
import type { Result } from '../resultado.js';
import type { ErroDeApuracao } from './apuracao-do-mes.js';

/* eslint-disable @typescript-eslint/no-unused-vars -- esboço */
// #region margem-de-isencao
// Desafio do Capítulo 9: quanto ainda se pode vender em ações, em
// operação comum, sem perder a isenção do mês. Os testes estão em
// test/dominio/margem-de-isencao.test.ts.
export function margemDeIsencao(
  operacoesDoMes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<Dinheiro, ErroDeApuracao> {
  throw new Error('Desafio do Capítulo 9 não resolvido');
}
// #endregion
/* eslint-enable @typescript-eslint/no-unused-vars */

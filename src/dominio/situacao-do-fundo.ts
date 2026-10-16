import type { DataDoCalendario } from './data-do-calendario.js';
import type { Quantidade } from './quantidade.js';

// #region ativo-requisitos-fii
// O que a isenção dos rendimentos de um FII pergunta ao fundo, a
// partir de uma data. A situação muda com o tempo: vale a mais recente
// que já tinha começado na data do pagamento.
export interface SituacaoDoFundo {
  readonly desde: DataDoCalendario;
  readonly negociacao: 'bolsa-ou-balcao-organizado' | 'outra';
  readonly cotistas: number;
  readonly cotasEmitidas: Quantidade;
}

// Uma nova situação entra na ordem das datas. A ordenação é estável:
// com a mesma data, a incluída depois fica depois, e é ela que vale.
// Incluir de novo a situação de uma data a corrige.
export function incluirEmOrdem(
  situacoes: readonly SituacaoDoFundo[],
  nova: SituacaoDoFundo,
): readonly SituacaoDoFundo[] {
  return [...situacoes, nova].toSorted((uma, outra) =>
    uma.desde.localeCompare(outra.desde),
  );
}

// A situação de uma data é a mais recente que já tinha começado.
export function situacaoEm(
  situacoes: readonly SituacaoDoFundo[],
  data: DataDoCalendario,
): SituacaoDoFundo | undefined {
  return situacoes.findLast(({ desde }) => desde <= data);
}
// #endregion

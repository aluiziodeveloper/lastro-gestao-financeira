import type { Operacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import { dividir, type ErroDeSeparacao } from './dividir-operacao.js';

export type { ErroDeSeparacao } from './dividir-operacao.js';

// #region parear
// Um lado do dia, as compras ou as vendas, repartido entre o que entra
// no day trade e o que fica de fora, na ordem dos negócios.
export interface Pareamento {
  readonly falta: bigint;
  readonly dentro: readonly Operacao[];
  readonly fora: readonly Operacao[];
}

export function parear(
  lado: readonly Operacao[],
  quantidade: bigint,
): Result<Pareamento, ErroDeSeparacao> {
  const inicio: Result<Pareamento, ErroDeSeparacao> = ok({
    falta: quantidade,
    dentro: [],
    fora: [],
  });
  return lado.reduce(
    (pareamento, operacao) =>
      pareamento.ok ? passo(pareamento.valor, operacao) : pareamento,
    inicio,
  );
}

function passo(
  pareamento: Pareamento,
  operacao: Operacao,
): Result<Pareamento, ErroDeSeparacao> {
  const { falta, dentro, fora } = pareamento;
  const quantidade = operacao.quantidade.paraBigInt();
  if (falta === 0n) {
    return ok({ ...pareamento, fora: [...fora, operacao] });
  }
  if (quantidade <= falta) {
    const resta = falta - quantidade;
    return ok({ falta: resta, dentro: [...dentro, operacao], fora });
  }
  return dividirNoFim(pareamento, operacao);
}

// O negócio que passa do que falta é dividido: uma parte entra, e o
// resto fica de fora.
function dividirNoFim(
  { falta, dentro, fora }: Pareamento,
  operacao: Operacao,
): Result<Pareamento, ErroDeSeparacao> {
  const partes = dividir(operacao, falta);
  if (!partes.ok) {
    return partes;
  }
  const [parte, resto] = partes.valor;
  return ok({
    falta: 0n,
    dentro: [...dentro, parte],
    fora: [...fora, resto],
  });
}
// #endregion

// #region compensacao-da-cena
// A apuração do aplicativo da cena, fora do Lastro e resumida, em
// centavos. Os resultados do mês se somam numa conta só, de qualquer
// classe, e qualquer imposto positivo vira DARF.
export interface ResultadoDaCena {
  readonly classe: 'acao' | 'fii';
  readonly resultado: bigint;
}

export function impostoDoMes(resultados: readonly ResultadoDaCena[]) {
  const total = resultados.reduce(
    (soma, { resultado }) => soma + resultado,
    0n,
  );
  if (total <= 0n) {
    return 0n;
  }
  return (total * 15n) / 100n;
}

export function emiteDarf(imposto: bigint): boolean {
  return imposto > 0n;
}
// #endregion

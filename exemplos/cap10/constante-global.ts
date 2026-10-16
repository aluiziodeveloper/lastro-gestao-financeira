// #region constante-global
// A apuração do aplicativo da cena, fora do Lastro e resumida, na
// versão publicada em 11/6/2025. A alíquota é uma constante global,
// em milésimos; o mês só aparece na assinatura.
export const ALIQUOTA_ACOES = 175n;

export function impostoDoMes(mes: string, lucro: bigint): bigint {
  if (lucro <= 0n) {
    return 0n;
  }
  return (lucro * ALIQUOTA_ACOES) / 1000n;
}
// #endregion

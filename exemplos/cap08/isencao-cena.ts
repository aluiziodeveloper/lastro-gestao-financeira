// #region isencao-cena
// A apuração de outra equipe, fora do Lastro: vendas de ações de até
// R$ 20.000,00 no mês são isentas (Lei 11.033/2004, art. 3º, I).
export const LIMITE_EM_CENTAVOS = 20_000_00n;

export function vendasIsentas(totalDoMesEmCentavos: bigint): boolean {
  return totalDoMesEmCentavos <= LIMITE_EM_CENTAVOS;
}
// #endregion

// #region arredondar-cedo
// O imposto de cada venda arredondado ao centavo, meio para cima, e
// depois somado, como faria um sistema que grava o imposto venda a
// venda. Valores em centavos; 15% de cada lucro.
export function impostoVendaAVenda(lucros: readonly bigint[]): bigint {
  return lucros.reduce(
    (total, lucro) => total + (lucro * 15n + 50n) / 100n,
    0n,
  );
}
// #endregion

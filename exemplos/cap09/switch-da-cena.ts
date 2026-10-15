// #region switch-da-cena
// A apuração do aplicativo da cena, fora do Lastro e resumida: um
// switch por classe de ativo, com valores em centavos. Os dois defeitos
// da cena estão aqui como estavam lá.
export type ClasseDaCena = 'acao' | 'fii' | 'etf';

export interface VendasDoMes {
  readonly classe: ClasseDaCena;
  readonly totalVendido: bigint;
  readonly lucro: bigint;
}

const LIMITE = 20_000_00n;

export function impostoDoMes(vendas: VendasDoMes): bigint {
  const { classe, totalVendido, lucro } = vendas;
  if (lucro <= 0n) {
    return 0n;
  }
  switch (classe) {
    case 'acao':
      // Tributa só o que passou do limite, e não o lucro inteiro.
      if (totalVendido <= LIMITE) {
        return 0n;
      }
      return ((totalVendido - LIMITE) * 15n) / 100n;
    case 'fii':
      // O caso das ações, copiado com a isenção junto.
      if (totalVendido <= LIMITE) {
        return 0n;
      }
      return ((totalVendido - LIMITE) * 20n) / 100n;
    case 'etf':
      return (lucro * 15n) / 100n;
  }
}
// #endregion

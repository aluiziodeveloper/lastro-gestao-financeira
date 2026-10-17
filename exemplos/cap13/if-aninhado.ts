// #region if-aninhado
// A ferramenta da cena, fora do Lastro e resumida, em centavos. Ela
// mira 50% exatos em cada classe, e cada regra nova entrou como mais
// um if dentro dos outros.
export interface Movimento {
  readonly vender: 'acoes' | 'fii' | 'nada';
  readonly valor: bigint;
  readonly comprar: bigint;
}

export function sugerir(
  acoes: bigint,
  fii: bigint,
  aporte: bigint,
): Movimento {
  const alvo = (acoes + fii + aporte) / 2n;
  if (acoes > alvo) {
    if (aporte > 0n) {
      const valor = acoes - alvo;
      return { vender: 'acoes', valor, comprar: valor + aporte };
    }
    return {
      vender: 'acoes',
      valor: acoes - alvo,
      comprar: acoes - alvo,
    };
  } else {
    if (fii > alvo) {
      if (aporte > 0n) {
        const valor = fii - alvo;
        return { vender: 'fii', valor, comprar: valor + aporte };
      }
      return { vender: 'fii', valor: fii - alvo, comprar: fii - alvo };
    }
  }
  return { vender: 'nada', valor: 0n, comprar: aporte };
}
// #endregion

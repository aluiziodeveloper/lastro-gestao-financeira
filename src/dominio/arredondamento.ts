// #region modo-de-arredondamento
export type ModoDeArredondamento =
  'truncar' | 'meio-para-cima' | 'meio-par';
// #endregion

// #region dividir-arredondando
// Os modos valem sobre o valor absoluto: o resultado de −5 ÷ 2 é o
// oposto do de 5 ÷ 2, em qualquer modo.
export function dividirArredondando(
  dividendo: bigint,
  divisor: bigint,
  modo: ModoDeArredondamento,
): bigint {
  const quociente = dividendo / divisor; // trunca em direção a zero
  const resto = dividendo % divisor;
  if (resto === 0n || modo === 'truncar') {
    return quociente;
  }
  const afastarDoZero =
    dividendo * divisor > 0n ? quociente + 1n : quociente - 1n;
  const dobroDoResto = absoluto(resto) * 2n;
  const divisorAbsoluto = absoluto(divisor);
  if (dobroDoResto < divisorAbsoluto) {
    return quociente;
  }
  if (dobroDoResto > divisorAbsoluto) {
    return afastarDoZero;
  }
  // Exatamente no meio: só aqui os modos diferem.
  if (modo === 'meio-para-cima' || quociente % 2n !== 0n) {
    return afastarDoZero;
  }
  return quociente;
}
// #endregion

function absoluto(valor: bigint): bigint {
  return valor < 0n ? -valor : valor;
}

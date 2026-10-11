// Refatorar e corrigir no mesmo commit (Capítulo 6): a mesma função
// antes e depois de um commit que mudou a forma e o comportamento. O
// Node 24 executa este arquivo removendo os tipos:
// node exemplos/cap06/refatorar-e-corrigir.ts

const limiteDeIsencao = 20_000_00n;

// #region refatorar-e-corrigir
// Antes do commit: aninhada e com else.
export function isentaAntes(
  totalVendidoEmCentavos: bigint,
  ehAcao: boolean,
): boolean {
  if (ehAcao) {
    if (totalVendidoEmCentavos < limiteDeIsencao) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// Depois do commit: uma guarda e um retorno direto.
export function isentaDepois(
  totalVendidoEmCentavos: bigint,
  ehAcao: boolean,
): boolean {
  if (!ehAcao) {
    return false;
  }
  return totalVendidoEmCentavos <= limiteDeIsencao;
}
// #endregion

console.log(
  'R$ 19.999,99 →',
  isentaAntes(19_999_99n, true),
  isentaDepois(19_999_99n, true),
);
console.log(
  'R$ 20.000,00 →',
  isentaAntes(20_000_00n, true),
  isentaDepois(20_000_00n, true),
);
console.log(
  'R$ 20.000,01 →',
  isentaAntes(20_000_01n, true),
  isentaDepois(20_000_01n, true),
);

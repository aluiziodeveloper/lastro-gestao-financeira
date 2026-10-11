// Quando seguir a regra piora o código (Capítulo 6): a mesma busca,
// escrita com dois níveis e reescrita para caber em um.
// node exemplos/cap06/regra-que-piora.ts

interface VendaDoDia {
  readonly dia: string;
  readonly totalEmCentavos: bigint;
}

const limiteDeIsencao = 20_000_00n;

// #region regra-que-piora
// Dois níveis: o laço e a condição de parada, lidos de cima para baixo.
export function diaQuePassaDaIsencao(
  vendas: readonly VendaDoDia[],
): string | undefined {
  let acumulado = 0n;
  for (const venda of vendas) {
    acumulado += venda.totalEmCentavos;
    if (acumulado > limiteDeIsencao) {
      return venda.dia;
    }
  }
  return undefined;
}

// Um nível: o corpo do laço sai, e o estado da busca passa a viajar
// num objeto que só existe para obedecer à regra. O laço também perde
// a saída antecipada e percorre todas as vendas.
interface Busca {
  readonly acumulado: bigint;
  readonly dia: string | undefined;
}

function avancar(busca: Busca, venda: VendaDoDia): Busca {
  if (busca.dia !== undefined) {
    return busca;
  }
  const acumulado = busca.acumulado + venda.totalEmCentavos;
  const dia = acumulado > limiteDeIsencao ? venda.dia : undefined;
  return { acumulado, dia };
}

export function diaQuePassaDaIsencaoEmUmNivel(
  vendas: readonly VendaDoDia[],
): string | undefined {
  return vendas.reduce(avancar, { acumulado: 0n, dia: undefined }).dia;
}
// #endregion

const marco: readonly VendaDoDia[] = [
  { dia: '2026-03-05', totalEmCentavos: 12_000_00n },
  { dia: '2026-03-12', totalEmCentavos: 9_000_00n },
  { dia: '2026-03-19', totalEmCentavos: 4_000_00n },
];
console.log('dois níveis →', diaQuePassaDaIsencao(marco));
console.log('um nível    →', diaQuePassaDaIsencaoEmUmNivel(marco));

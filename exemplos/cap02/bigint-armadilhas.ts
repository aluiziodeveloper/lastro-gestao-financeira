// Armadilhas do bigint (Capítulo 2). O Node 24 executa este arquivo
// removendo os tipos: node exemplos/cap02/bigint-armadilhas.ts

function tentar(descricao: string, operacao: () => unknown): void {
  try {
    console.log(descricao, operacao());
  } catch (erro) {
    console.log(descricao, String(erro));
  }
}

// O compilador barra: bigint e number não se misturam.
// @ts-expect-error -- TS2365, bigint somado a number
// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
tentar('1n + 1 →', () => 1n + 1);
// @ts-expect-error -- TS2345, Math só aceita number
tentar('Math.max(1n, 2n) →', () => Math.max(1n, 2n));

// O compilador aceita, mas a execução falha.
tentar('JSON.stringify →', () => JSON.stringify({ total: 115_00n }));

// Não falha, mas surpreende: a divisão trunca em direção a zero.
tentar('7n / 2n →', () => 7n / 2n);
tentar('-7n / 2n →', () => -7n / 2n);

// O separador deixa os centavos legíveis: R$ 20.000,00.
tentar('20_000_00n →', () => 20_000_00n);

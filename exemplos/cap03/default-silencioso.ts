// O default: que esconde um caso novo (Capítulo 3). A união ganhou o
// desdobramento, o switch não, e o compilador não reclama: o default
// captura o caso novo antes que a exaustividade seja verificada.
// Execução: node exemplos/cap03/default-silencioso.ts

type TipoDeOperacao = 'compra' | 'venda' | 'desdobramento';

function variacaoNaPosicao(
  tipo: TipoDeOperacao,
  quantidade: bigint,
): bigint {
  switch (tipo) {
    case 'compra':
      return quantidade;
    case 'venda':
      return -quantidade;
    default:
      // O desdobramento cai aqui: as ações novas somem da posição.
      return 0n;
  }
}

console.log('compra de 100 →', variacaoNaPosicao('compra', 100n));
console.log(
  'desdobramento de 100 →',
  variacaoNaPosicao('desdobramento', 100n),
);

// Desafio do Capítulo 6: refatore este relatório até ele passar nas
// regras 1, 2 e 5 de Calisthenics, sem mudar o que ele imprime. Os
// testes de caracterização estão em relatorio-de-posicoes.test.ts e
// rodam com: npx vitest run -c exemplos/vitest.config.ts

export interface PosicaoNoRelatorio {
  readonly ativo: {
    readonly ticker: string;
    readonly classe: 'acao' | 'fii' | 'etf';
  };
  readonly quantidade: number;
  readonly custoTotalEmCentavos: bigint;
}

function reais(centavos: bigint): string {
  const inteiros = (centavos / 100n).toString();
  const resto = (centavos % 100n).toString().padStart(2, '0');
  const milhar = inteiros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${milhar},${resto}`;
}

// #region relatorio-de-posicoes
export function linhasDoRelatorio(
  posicoes: readonly PosicaoNoRelatorio[],
): string[] {
  const linhas: string[] = [];
  for (const posicao of posicoes) {
    if (posicao.quantidade > 0) {
      let classe: string;
      if (posicao.ativo.classe === 'acao') {
        classe = 'ação';
      } else {
        if (posicao.ativo.classe === 'fii') {
          classe = 'FII';
        } else {
          classe = posicao.ativo.classe;
        }
      }
      const medio =
        posicao.custoTotalEmCentavos / BigInt(posicao.quantidade);
      linhas.push(
        `${posicao.ativo.ticker.toUpperCase()} · ${classe} · ` +
          `${String(posicao.quantidade)} × ${reais(medio)}`,
      );
    }
  }
  return linhas;
}
// #endregion

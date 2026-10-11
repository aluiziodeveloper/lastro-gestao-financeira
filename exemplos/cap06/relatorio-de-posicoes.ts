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
// A classe do ETF sai como está no cadastro: os testes de
// caracterização fixam esse comportamento, e mudá-lo é outro commit.
const nomeDaClasse = { acao: 'ação', fii: 'FII', etf: 'etf' } as const;

function linha({
  ativo: { ticker, classe },
  quantidade,
  custoTotalEmCentavos,
}: PosicaoNoRelatorio): string {
  const medio = custoTotalEmCentavos / BigInt(quantidade);
  const nome = nomeDaClasse[classe];
  const ativo = `${ticker.toUpperCase()} · ${nome}`;
  return `${ativo} · ${String(quantidade)} × ${reais(medio)}`;
}

export function linhasDoRelatorio(
  posicoes: readonly PosicaoNoRelatorio[],
): string[] {
  return posicoes
    .filter((posicao) => posicao.quantidade > 0)
    .map(linha);
}
// #endregion

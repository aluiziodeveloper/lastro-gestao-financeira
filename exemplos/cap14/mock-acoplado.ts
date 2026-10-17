// #region servico-acoplado
// O serviço da cena, fora do Lastro e resumido: fala direto com o
// SQLite, pelo prepare().all() e pelo prepare().run().
interface Comando {
  all(...parametros: unknown[]): unknown[];
  run(...parametros: unknown[]): unknown;
}

export interface BancoSqlite {
  prepare(sql: string): Comando;
}

export interface Lancamento {
  readonly ticker: string;
  readonly tipo: 'compra' | 'venda';
  readonly quantidade: bigint;
}

export function posicaoDe(banco: BancoSqlite, ticker: string): bigint {
  const linhas = banco
    .prepare('SELECT tipo, quantidade FROM operacoes WHERE ticker = ?')
    .all(ticker) as Lancamento[];
  return linhas.reduce(
    (total, { tipo, quantidade }) =>
      tipo === 'compra' ? total + quantidade : total - quantidade,
    0n,
  );
}

export function registrar(
  banco: BancoSqlite,
  lancamento: Lancamento,
): void {
  banco
    .prepare(
      `INSERT INTO operacoes (ticker, tipo, quantidade)
         VALUES (?, ?, ?)`,
    )
    .run(lancamento.ticker, lancamento.tipo, lancamento.quantidade);
}
// #endregion

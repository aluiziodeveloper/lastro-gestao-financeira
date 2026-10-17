import type { Lancamento } from './mock-acoplado.js';

// #region servico-no-postgres
// O mesmo serviço depois da troca para o Postgres: as regras são as
// mesmas, e a conversa com o banco muda inteira. O pg responde com
// await, entrega as linhas em rows e o BIGINT como texto.
export interface ClientePostgres {
  query(
    sql: string,
    parametros: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
}

export async function posicaoDe(
  cliente: ClientePostgres,
  ticker: string,
): Promise<bigint> {
  const { rows } = await cliente.query(
    'SELECT tipo, quantidade FROM operacoes WHERE ticker = $1',
    [ticker],
  );
  return rows.reduce<bigint>(
    (total, linha) =>
      linha['tipo'] === 'compra'
        ? total + BigInt(String(linha['quantidade']))
        : total - BigInt(String(linha['quantidade'])),
    0n,
  );
}

export async function registrar(
  cliente: ClientePostgres,
  lancamento: Lancamento,
): Promise<void> {
  await cliente.query(
    `INSERT INTO operacoes (ticker, tipo, quantidade)
       VALUES ($1, $2, $3)`,
    [lancamento.ticker, lancamento.tipo, String(lancamento.quantidade)],
  );
}
// #endregion

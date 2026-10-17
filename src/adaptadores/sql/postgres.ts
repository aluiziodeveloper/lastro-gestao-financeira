import pg from 'pg';

import type { RepositorioDeCarteiras } from '../../aplicacao/portas.js';
import type { IdDeCarteira } from '../../dominio/id-de-carteira.js';
import type { Operacao } from '../../dominio/operacao.js';
import { esquema } from './esquema.js';
import {
  colunas,
  type LinhaDeOperacao,
  operacaoDa,
  valoresDa,
} from './mapeamento.js';

// #region repositorio-postgres
// O mesmo repositório no Postgres, pelo pacote pg. O pg entrega o
// BIGINT como texto, porque um number não guarda 64 bits; o tipo 20
// passa a virar bigint, só nas conexões deste pool. O pool reaproveita
// conexões abertas, e fechar() as encerra.
export interface RepositorioPostgres extends RepositorioDeCarteiras {
  fechar(): Promise<void>;
}

export async function repositorioPostgres(
  url: string,
): Promise<RepositorioPostgres> {
  const tipos = new pg.TypeOverrides();
  tipos.setTypeParser(pg.types.builtins.INT8, (texto) => BigInt(texto));
  const pool = new pg.Pool({ connectionString: url, types: tipos });
  await pool.query(esquema);
  return {
    operacoesDe: async (id) => {
      const { rows } = await pool.query<LinhaDeOperacao>(
        `SELECT ${colunas} FROM operacoes WHERE carteira = $1
           ORDER BY sequencia`,
        [id],
      );
      return rows.map(operacaoDa);
    },
    acrescentar: (id, operacoes) => inserir(pool, id, operacoes),
    fechar: () => pool.end(),
  };
}
// #endregion

// Uma conexão só para a transação inteira: BEGIN, os INSERT e COMMIT;
// qualquer erro desfaz tudo com ROLLBACK.
async function inserir(
  pool: pg.Pool,
  id: IdDeCarteira,
  operacoes: readonly Operacao[],
): Promise<void> {
  const conexao = await pool.connect();
  try {
    await conexao.query('BEGIN');
    await inserirTodas(conexao, id, operacoes);
    await conexao.query('COMMIT');
  } catch (erro) {
    await conexao.query('ROLLBACK');
    throw erro;
  } finally {
    conexao.release();
  }
}

// Cada operação ganha o número seguinte ao último da carteira; uma
// espera a outra, na mesma conexão.
async function inserirTodas(
  conexao: pg.PoolClient,
  id: IdDeCarteira,
  operacoes: readonly Operacao[],
): Promise<void> {
  const { rows } = await conexao.query<{ n: bigint }>(
    `SELECT COALESCE(MAX(sequencia), 0) AS n FROM operacoes
       WHERE carteira = $1`,
    [id],
  );
  const ultima = rows[0]?.n ?? 0n;
  for (const [indice, operacao] of operacoes.entries()) {
    await conexao.query(
      'INSERT INTO operacoes VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, ultima + BigInt(indice) + 1n, ...valoresDa(operacao)],
    );
  }
}

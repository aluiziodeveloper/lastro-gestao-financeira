import { DatabaseSync, type StatementSync } from 'node:sqlite';

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

// #region repositorio-sql
// O repositório num arquivo SQLite, pelo módulo node:sqlite do Node.
// Os inteiros voltam como bigint (readBigInts), e os valores entram por
// parâmetros (?), nunca colados no texto do SQL.
export function repositorioSqlite(
  caminho: string,
): RepositorioDeCarteiras {
  const banco = new DatabaseSync(caminho, { readBigInts: true });
  banco.exec(esquema);
  const selecionar = banco.prepare(
    `SELECT ${colunas} FROM operacoes WHERE carteira = ?
       ORDER BY sequencia`,
  );
  return {
    operacoesDe: (id) =>
      comoPromise(() => {
        const linhas = selecionar.all(
          id,
        ) as unknown as LinhaDeOperacao[];
        return linhas.map(operacaoDa);
      }),
    acrescentar: (id, operacoes) =>
      comoPromise(() => {
        emTransacao(banco, () => {
          inserir(banco, id, operacoes);
        });
      }),
  };
}

// As operações de uma chamada entram numa transação: todas ou nenhuma.
// Cada uma ganha o número seguinte ao último da carteira.
function inserir(
  banco: DatabaseSync,
  id: IdDeCarteira,
  operacoes: readonly Operacao[],
): void {
  const ultima: StatementSync = banco.prepare(
    `SELECT COALESCE(MAX(sequencia), 0) AS n FROM operacoes
       WHERE carteira = ?`,
  );
  const { n } = ultima.get(id) as { n: bigint };
  const inserirUma = banco.prepare(
    'INSERT INTO operacoes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  operacoes.forEach((operacao, indice) => {
    inserirUma.run(id, n + BigInt(indice) + 1n, ...valoresDa(operacao));
  });
}

// O node:sqlite responde na hora, e a porta pede Promise. Um erro
// lançado dentro do executor da Promise vira rejeição, e quem usa
// await o recebe como qualquer falha do banco.
function comoPromise<T>(trabalho: () => T): Promise<T> {
  return new Promise((resolve) => {
    resolve(trabalho());
  });
}

function emTransacao(banco: DatabaseSync, trabalho: () => void): void {
  banco.exec('BEGIN');
  try {
    trabalho();
    banco.exec('COMMIT');
  } catch (erro) {
    banco.exec('ROLLBACK');
    throw erro;
  }
}
// #endregion

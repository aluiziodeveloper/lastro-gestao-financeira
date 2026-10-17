import pg from 'pg';
import { afterAll, describe } from 'vitest';

import {
  repositorioPostgres,
  type RepositorioPostgres,
} from '../../src/adaptadores/sql/postgres.js';
import { contratoDoRepositorio } from './repositorio.contrato.js';

// #region contrato-postgres
// O contrato no Postgres roda quando há um banco: a variável
// LASTRO_POSTGRES_URL diz onde. Sem ela, os testes aparecem como
// pulados. Cada teste começa com a tabela vazia.
const url = process.env['LASTRO_POSTGRES_URL'];
const abertos: RepositorioPostgres[] = [];

describe.runIf(url !== undefined)('Postgres', () => {
  afterAll(async () => {
    await Promise.all(
      abertos.map((repositorio) => repositorio.fechar()),
    );
  });

  contratoDoRepositorio('Postgres', async () => {
    const repositorio = await repositorioPostgres(url ?? '');
    abertos.push(repositorio);
    const limpeza = new pg.Client({ connectionString: url });
    await limpeza.connect();
    await limpeza.query('TRUNCATE operacoes');
    await limpeza.end();
    return repositorio;
  });
});
// #endregion

import { repositorioSqlite } from '../../src/adaptadores/sql/sqlite.js';
import { contratoDoRepositorio } from './repositorio.contrato.js';

// #region contrato-sqlite
// Um banco novo em memória para cada teste: nada passa de um teste ao
// outro, e não há arquivo para apagar.
contratoDoRepositorio('SQLite', () =>
  Promise.resolve(repositorioSqlite(':memory:')),
);
// #endregion

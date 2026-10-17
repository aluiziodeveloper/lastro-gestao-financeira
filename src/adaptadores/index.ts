// Os adaptadores do Lastro, num ponto de entrada à parte:
// '@aluiziodeveloper/lastro/adaptadores'. Importá-los carrega o Fastify
// e o pg; quem usa só o domínio não paga por isso.
export { repositorioEmMemoria } from './memoria/repositorio.js';
export { repositorioSqlite } from './sql/sqlite.js';
export {
  repositorioPostgres,
  type RepositorioPostgres,
} from './sql/postgres.js';
export {
  cabecalho,
  type ErroDeImportacao,
  importarCsv,
} from './csv/importador.js';
export { criarApp } from './http/app.js';
export type { Dependencias } from './http/rotas.js';
export { relogioDoSistema } from './relogio-do-sistema.js';

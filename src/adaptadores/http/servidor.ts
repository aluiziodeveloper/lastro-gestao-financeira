import { referenciasDoLastro } from '../referencias.js';
import { repositorioPostgres } from '../sql/postgres.js';
import { criarApp } from './app.js';

// #region servidor
// A raiz de composição da API: escolhe o Postgres e os dados de
// referência e põe a aplicação para ouvir. Dentro de um contêiner,
// ouvir em localhost só atende o próprio contêiner; 0.0.0.0 atende
// qualquer interface, inclusive a porta publicada pelo Docker.
const url = process.env['LASTRO_POSTGRES_URL'];
if (url === undefined) {
  throw new Error(
    'Defina LASTRO_POSTGRES_URL com o endereço do banco.',
  );
}
const referencias = referenciasDoLastro();
if (!referencias.ok) {
  throw new Error('Os regimes tributários do Lastro estão inválidos.');
}
const repositorio = await repositorioPostgres(url);
const app = criarApp({ repositorio, referencias: referencias.valor });
const porta = Number(process.env['PORTA'] ?? '3000');
await app.listen({ host: '0.0.0.0', port: porta });
process.stdout.write(`Lastro ouvindo na porta ${String(porta)}\n`);

// O Docker pede o fim com SIGTERM: a aplicação para de aceitar
// pedidos, termina os que estão em curso e fecha as conexões do banco.
process.once('SIGTERM', () => {
  void app.close().then(() => repositorio.fechar());
});
// #endregion

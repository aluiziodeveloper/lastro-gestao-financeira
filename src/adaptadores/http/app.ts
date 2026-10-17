import { fastify, type FastifyInstance } from 'fastify';

import { type Dependencias, registrarRotas } from './rotas.js';

// #region app
// A aplicação HTTP recebe as dependências prontas: quem a monta escolhe
// o repositório e os dados de referência, e os testes passam os seus.
export function criarApp(dependencias: Dependencias): FastifyInstance {
  const app = fastify();
  registrarRotas(app, dependencias);
  return app;
}
// #endregion

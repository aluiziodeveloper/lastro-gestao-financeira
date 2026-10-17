import type { FastifyInstance, FastifyReply } from 'fastify';

import type { RepositorioDeCarteiras } from '../../aplicacao/portas.js';
import { registrarOperacoes } from '../../aplicacao/registrar-operacoes.js';
import type { DadosDeReferencia } from '../../dominio/dados-de-referencia.js';
import { criarIdDeCarteira } from '../../dominio/id-de-carteira.js';
import { posicao, relatorio } from './consultas.js';
import {
  corpoDeOperacoes,
  type OperacaoEmJson,
  todasDoJson,
} from './entrada.js';
import { respostaDoErro } from './erros.js';
import { entradaInvalida, type Resposta } from './resposta.js';

export interface Dependencias {
  readonly repositorio: RepositorioDeCarteiras;
  readonly referencias: DadosDeReferencia;
}

interface Pedido {
  Params: { id: string; mes: string };
  Body: { operacoes: OperacaoEmJson[] };
}

// #region rotas-carteira
// Cada rota traduz o pedido, chama um caso de uso e traduz a resposta.
// Nenhuma decide regra: o que o domínio recusa volta com o status do
// erro, e o corpo diz o tipo dele.
export function registrarRotas(
  app: FastifyInstance,
  { repositorio, referencias }: Dependencias,
): void {
  app.post<Pedido>(
    '/carteiras/:id/operacoes',
    { schema: { body: corpoDeOperacoes } },
    async ({ params, body }, r) =>
      enviar(
        r,
        await registrar(repositorio, params.id, body.operacoes),
      ),
  );
  app.get<Pedido>(
    '/carteiras/:id/relatorios/:mes',
    async ({ params }, r) =>
      enviar(r, await relatorio({ repositorio, referencias }, params)),
  );
  app.get<Pedido>('/carteiras/:id', async ({ params }, r) =>
    enviar(r, await posicao(repositorio, params.id)),
  );
}

function enviar(r: FastifyReply, { status, corpo }: Resposta) {
  return r.code(status).send(corpo);
}

async function registrar(
  repositorio: RepositorioDeCarteiras,
  texto: string,
  json: readonly OperacaoEmJson[],
): Promise<Resposta> {
  const id = criarIdDeCarteira(texto);
  const operacoes = todasDoJson(json);
  if (!id.ok || !operacoes.ok) {
    return entradaInvalida;
  }
  const registro = await registrarOperacoes(
    repositorio,
    id.valor,
    operacoes.valor,
  );
  return registro.ok
    ? { status: 201, corpo: { registradas: operacoes.valor.length } }
    : respostaDoErro(registro.erro);
}
// #endregion

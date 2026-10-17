import { describe, expect, it } from 'vitest';

import { criarApp } from '../../src/adaptadores/http/app.js';
import { repositorioSqlite } from '../../src/adaptadores/sql/sqlite.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { referenciasCom } from '../dominio/referencias.js';

const referencias = referenciasCom(
  CatalogoDeAtivos.vazio()
    .com(extrair(Ticker.criar('PETR4')), 'acao')
    .com(extrair(Ticker.criar('HGLG11')), 'fii'),
);

function operacao(
  id: string,
  tipo: 'compra' | 'venda',
  data: string,
  [ticker, quantidade, preco]: readonly [string, number, string],
) {
  const centavos = { precoEmCentavos: preco, custosEmCentavos: '0' };
  return { id, tipo, data, ticker, quantidade, ...centavos };
}

const abril = [
  operacao('op-1', 'compra', '2026-02-02', ['PETR4', 1_000, '2200']),
  operacao('op-2', 'compra', '2026-04-02', ['HGLG11', 100, '16000']),
  operacao('op-3', 'venda', '2026-04-15', ['PETR4', 1_000, '2500']),
  operacao('op-4', 'venda', '2026-04-15', ['HGLG11', 100, '13000']),
];

// #region api-integracao
// A API inteira, do pedido HTTP ao SQLite, sem rede: o inject do
// Fastify entrega o pedido à aplicação e devolve a resposta. Cada
// teste tem a sua aplicação, com um banco novo em memória.
function api() {
  const repositorio = repositorioSqlite(':memory:');
  const app = criarApp({ repositorio, referencias });
  const enviar = (operacoes: readonly object[]) =>
    app.inject({
      method: 'POST',
      url: '/carteiras/minha/operacoes',
      payload: { operacoes },
    });
  return { app, enviar };
}

describe('API HTTP', () => {
  it('registra as operações e responde o relatório', async () => {
    const { app, enviar } = api();

    const registro = await enviar(abril);
    const resposta = await app.inject(
      '/carteiras/minha/relatorios/2026-04',
    );

    expect(registro.statusCode).toBe(201);
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json<{ linhas: string[] }>().linhas.at(-1)).toBe(
      'DARF 6015: R$ 450,00, vencimento 29/05/2026',
    );
  });

  it('o que o domínio recusa volta com o status do erro', async () => {
    const { enviar } = api();
    await enviar(abril);

    const repetida = await enviar(abril.slice(0, 1));
    const descoberta = await enviar([
      operacao('op-5', 'venda', '2026-05-04', ['PETR4', 1, '2500']),
    ]);

    expect(repetida.statusCode).toBe(409);
    expect(repetida.json()).toEqual({ tipo: 'operacao-repetida' });
    expect(descoberta.statusCode).toBe(422);
    expect(descoberta.json()).toEqual({ tipo: 'venda-a-descoberto' });
  });
});
// #endregion

describe('API HTTP: entrada e posição', () => {
  it('a posição leva os centavos em texto, sem perda', async () => {
    const { app, enviar } = api();
    const grande = ['HGLG11', 1, '9007199254740993'] as const;
    await enviar([operacao('op-1', 'compra', '2026-04-02', grande)]);

    const resposta = await app.inject('/carteiras/minha');

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body).toContain('"centavos":"9007199254740993"');
    expect(resposta.json()).toMatchObject({
      ativos: [{ ticker: 'HGLG11', quantidade: '1' }],
    });
  });

  it.each<[string, object]>([
    ['o corpo fora do esquema', { id: 'op-1' }],
    ['a data inexistente', { ...abril[0], data: '2026-02-30' }],
    ['o preço com vírgula', { ...abril[0], precoEmCentavos: '22,00' }],
  ])('recusa com 400 %s', async (_caso, operacao) => {
    const { app } = api();

    const resposta = await app.inject({
      method: 'POST',
      url: '/carteiras/minha/operacoes',
      payload: { operacoes: [operacao] },
    });

    expect(resposta.statusCode).toBe(400);
  });

  it.each(['/carteiras/minha/relatorios/2026-13', '/carteiras/%20'])(
    'recusa com 400 o endereço %s',
    async (url) => {
      const { app } = api();

      expect((await app.inject(url)).statusCode).toBe(400);
    },
  );
});

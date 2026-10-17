import { describe, expect, it, vi } from 'vitest';

import * as noPostgres from './mock-acoplado-postgres.js';
import * as noSqlite from './mock-acoplado.js';
import type { Lancamento } from './mock-acoplado.js';

const compra: Lancamento = {
  ticker: 'PETR4',
  tipo: 'compra',
  quantidade: 300n,
};
const venda: Lancamento = {
  ticker: 'PETR4',
  tipo: 'venda',
  quantidade: 100n,
};

// Um banco falso com a forma do SQLite: prepare devolve um comando
// cujo all() responde as linhas dadas.
function sqliteFalso(linhas: readonly Lancamento[]) {
  const comando = { all: vi.fn(() => [...linhas]), run: vi.fn() };
  return { prepare: vi.fn(() => comando), comando };
}

// Os dois serviços com a mesma assinatura, para a mesma suíte. O do
// Postgres recebe o mesmo banco falso: é o que acontece com os testes
// quando só o código muda.
const servicos = [
  ['SQLite', noSqlite, it],
  ['Postgres', noPostgres, it.fails],
] as const;

// #region mock-acoplado
// Os testes da cena: cada um monta o banco falso com a forma do SQLite
// e confere o SQL que o serviço mandou. No Postgres, as regras são as
// mesmas e nenhum teste passa: it.fails registra a falha e mantém a
// suíte verde.
describe.each(servicos)('o serviço no %s', (_nome, servico, caso) => {
  const banco = (linhas: readonly Lancamento[]) =>
    sqliteFalso(linhas) as unknown as noSqlite.BancoSqlite &
      noPostgres.ClientePostgres;

  caso('soma as compras na posição', async () => {
    expect(
      await servico.posicaoDe(banco([compra, compra]), 'PETR4'),
    ).toBe(600n);
  });

  caso('desconta as vendas da posição', async () => {
    expect(
      await servico.posicaoDe(banco([compra, venda]), 'PETR4'),
    ).toBe(200n);
  });

  caso('sem operações, a posição é zero', async () => {
    expect(await servico.posicaoDe(banco([]), 'PETR4')).toBe(0n);
  });

  caso('consulta pelo ticker', async () => {
    const falso = sqliteFalso([]);
    await servico.posicaoDe(falso as never, 'PETR4');

    expect(falso.comando.all).toHaveBeenCalledWith('PETR4');
  });

  caso('grava a compra com os três valores', async () => {
    const falso = sqliteFalso([]);
    await servico.registrar(falso as never, compra);

    expect(falso.comando.run).toHaveBeenCalledWith(
      'PETR4',
      'compra',
      300n,
    );
  });
});
// #endregion

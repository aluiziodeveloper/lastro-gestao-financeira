import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterEach, describe, expect, it } from 'vitest';

import { repositorioSqlite } from '../../src/adaptadores/sql/sqlite.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra } from '../dominio/construtores.js';

const id = extrair(criarIdDeCarteira('carteira-1'));
const compra = umaCompra({ quantidade: 100, precoEmCentavos: 30_00n });
const pastas: string[] = [];

function arquivoNovo(): string {
  const pasta = mkdtempSync(join(tmpdir(), 'lastro-'));
  pastas.push(pasta);
  return join(pasta, 'lastro.db');
}

describe('Repositório SQLite', () => {
  afterEach(() => {
    pastas.splice(0).forEach((pasta) => {
      rmSync(pasta, { recursive: true });
    });
  });

  it('um arquivo guarda as operações de uma abertura para outra', async () => {
    const arquivo = arquivoNovo();
    await repositorioSqlite(arquivo).acrescentar(id, [compra]);

    expect(await repositorioSqlite(arquivo).operacoesDe(id)).toEqual([
      compra,
    ]);
  });

  it('uma linha que o domínio recusaria rejeita a leitura', async () => {
    const arquivo = arquivoNovo();
    const repositorio = repositorioSqlite(arquivo);
    new DatabaseSync(arquivo).exec(
      `INSERT INTO operacoes VALUES
        ('carteira-1', 1, 'op-9', 'compra', '2026-02-30', 'PETR4',
         100, 3000, 0)`,
    );

    await expect(repositorio.operacoesDe(id)).rejects.toThrow(
      'Operação inválida no banco: op-9',
    );
  });
});

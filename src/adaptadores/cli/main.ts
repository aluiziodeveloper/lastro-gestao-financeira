#!/usr/bin/env node
import { readFileSync } from 'node:fs';

import { err, ok } from '../../dominio/resultado.js';
import { repositorioSqlite } from '../sql/sqlite.js';
import { executar } from './executar.js';
import { referenciasDoLastro } from '../referencias.js';

// #region raiz-de-composicao
// A raiz de composição: o único lugar que escolhe os adaptadores de
// verdade e os entrega à CLI. O resto do Lastro recebe o que usa.
const referencias = referenciasDoLastro();
if (!referencias.ok) {
  throw new Error('Os regimes tributários do Lastro estão inválidos.');
}
process.exitCode = await executar(process.argv.slice(2), {
  abrir: repositorioSqlite,
  ler: (caminho) => {
    try {
      return ok(readFileSync(caminho, 'utf8'));
    } catch {
      return err(`Não foi possível ler ${caminho}.`);
    }
  },
  escrever: (linha) => process.stdout.write(`${linha}\n`),
  referencias: referencias.valor,
});
// #endregion

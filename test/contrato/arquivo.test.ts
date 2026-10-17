import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll } from 'vitest';

import { repositorioEmArquivo } from '../../src/adaptadores/arquivo/repositorio.js';
import { contratoDoRepositorio } from './repositorio.contrato.js';

// #region contrato-arquivo
// Um arquivo novo para cada teste, numa pasta temporária que some no
// fim da suíte. O arquivo ainda não existe quando o teste começa.
const pasta = mkdtempSync(join(tmpdir(), 'lastro-arquivo-'));
let contador = 0;

afterAll(() => {
  rmSync(pasta, { recursive: true });
});

contratoDoRepositorio('arquivo JSON', () => {
  contador += 1;
  const arquivo = join(pasta, `carteiras-${String(contador)}.json`);
  return Promise.resolve(repositorioEmArquivo(arquivo));
});
// #endregion

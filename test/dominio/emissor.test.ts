import { describe, expect, it } from 'vitest';

import { criarEmissor } from '../../src/dominio/emissor.js';
import { err, ok } from '../../src/dominio/resultado.js';

describe('Emissor', () => {
  it('aceita o nome da empresa, sem os espaços das pontas', () => {
    expect(criarEmissor(' petrobras ')).toEqual(ok('petrobras'));
  });

  it.each(['', '   '])('recusa um nome vazio: "%s"', (texto) => {
    expect(criarEmissor(texto)).toEqual(err({ tipo: 'emissor-vazio' }));
  });
});

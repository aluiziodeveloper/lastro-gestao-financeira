import { afterEach, describe, expect, it, vi } from 'vitest';

import { executar } from '../../src/adaptadores/cli/executar.js';
import { repositorioEmMemoria } from '../../src/adaptadores/memoria/repositorio.js';
import { referenciasDoLastro } from '../../src/adaptadores/referencias.js';
import { relogioDoSistema } from '../../src/adaptadores/relogio-do-sistema.js';
import { registrarOperacoes } from '../../src/aplicacao/registrar-operacoes.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { ok } from '../../src/dominio/resultado.js';
import { extrair } from '../../test/apoio/resultado.js';
import { umaVenda } from '../../test/dominio/construtores.js';

// #region migrado
// Um teste escrito para o Jest e migrado para o Vitest. Cada uso de
// vi tem, no comentário, o equivalente do Jest. No Vitest, describe,
// it, expect e vi são importados: os globais vêm desligados.

// jest.mock(caminho, () => ({ ...jest.requireActual(caminho), … }))
vi.mock('../../src/adaptadores/relogio-do-sistema.js', async () => {
  const original = await vi.importActual<
    typeof import('../../src/adaptadores/relogio-do-sistema.js')
  >('../../src/adaptadores/relogio-do-sistema.js');
  const agora = () => new Date('2026-11-01T00:30:00Z');
  return { ...original, relogioDoSistema: { agora } };
});

describe('Um teste migrado do Jest', () => {
  // jest.useRealTimers()
  afterEach(() => {
    vi.useRealTimers();
  });

  it('o módulo falso responde no lugar do relógio da máquina', () => {
    expect(relogioDoSistema.agora().toISOString()).toBe(
      '2026-11-01T00:30:00.000Z',
    );
  });

  it('o relógio falso para a hora de new Date()', () => {
    // jest.useFakeTimers(); jest.setSystemTime(…)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T13:00:00Z'));

    expect(new Date().toISOString()).toBe('2026-04-15T13:00:00.000Z');
  });

  it('a função falsa grava como foi chamada', async () => {
    // jest.fn()
    const escrever = vi.fn();

    const codigo = await executar(['apagar'], {
      abrir: repositorioEmMemoria,
      ler: () => ok(''),
      escrever,
      referencias: extrair(referenciasDoLastro()),
    });

    expect(codigo).toBe(2);
    expect(escrever).toHaveBeenCalledOnce();
  });

  it('o espião confere que a venda recusada não grava', async () => {
    const repositorio = repositorioEmMemoria();
    // jest.spyOn(objeto, 'metodo')
    const acrescentar = vi.spyOn(repositorio, 'acrescentar');
    const id = extrair(criarIdDeCarteira('minha'));
    const venda = umaVenda({ quantidade: 1, precoEmCentavos: 10_00n });

    await registrarOperacoes(repositorio, id, [venda]);

    expect(acrescentar).not.toHaveBeenCalled();
  });
});
// #endregion

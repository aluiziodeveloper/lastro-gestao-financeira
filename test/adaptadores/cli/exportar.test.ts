import { describe, expect, it } from 'vitest';

import { exportar } from '../../../src/adaptadores/cli/comandos.js';
import { executar } from '../../../src/adaptadores/cli/executar.js';
import { repositorioEmMemoria } from '../../../src/adaptadores/memoria/repositorio.js';
import { referenciasDoLastro } from '../../../src/adaptadores/referencias.js';
import { criarIdDeCarteira } from '../../../src/dominio/id-de-carteira.js';
import { ok } from '../../../src/dominio/resultado.js';
import { extrair } from '../../apoio/resultado.js';
import { umaCompra, umaVenda } from '../../dominio/construtores.js';

const id = extrair(criarIdDeCarteira('minha'));
const operacoes = [
  umaCompra({
    id: 'op-1',
    data: '2026-02-02',
    quantidade: 1_000,
    precoEmCentavos: 22_00n,
  }),
  umaCompra({
    id: 'op-2',
    ticker: 'HGLG11',
    data: '2026-04-02',
    quantidade: 100,
    precoEmCentavos: 160_00n,
  }),
  umaVenda({
    id: 'op-3',
    data: '2026-04-15',
    quantidade: 700,
    precoEmCentavos: 25_00n,
  }),
];

// O desafio do Capítulo 15: o comando exportar escreve a posição em
// CSV, no formato do extrato, um ativo por linha, na ordem em que
// entraram na carteira.
describe('Desafio do Capítulo 15: lastro exportar', () => {
  it('escreve a quantidade e o custo de cada ativo', async () => {
    const repositorio = repositorioEmMemoria();
    await repositorio.acrescentar(id, operacoes);

    expect(await exportar(repositorio, id)).toEqual(
      ok([
        'Ativo;Quantidade;Custo total',
        'PETR4;300;6.600,00',
        'HGLG11;100;16.000,00',
      ]),
    );
  });

  it('a carteira sem operações tem só o cabeçalho', async () => {
    expect(await exportar(repositorioEmMemoria(), id)).toEqual(
      ok(['Ativo;Quantidade;Custo total']),
    );
  });

  it('o comando sai com 0 e escreve as linhas', async () => {
    const repositorio = repositorioEmMemoria();
    await repositorio.acrescentar(id, operacoes);
    const escritas: string[] = [];

    const codigo = await executar(
      ['exportar', '--carteira', 'minha', '--banco', 'lastro.db'],
      {
        abrir: () => repositorio,
        ler: () => ok(''),
        escrever: (linha) => escritas.push(linha),
        referencias: extrair(referenciasDoLastro()),
      },
    );

    expect(codigo).toBe(0);
    expect(escritas).toHaveLength(3);
  });

  it('exportar com um argumento a mais é uso errado', async () => {
    const codigo = await executar(
      ['exportar', '2026-04', '--carteira', 'minha', '--banco', 'x'],
      {
        abrir: () => repositorioEmMemoria(),
        ler: () => ok(''),
        escrever: () => undefined,
        referencias: extrair(referenciasDoLastro()),
      },
    );

    expect(codigo).toBe(2);
  });
});

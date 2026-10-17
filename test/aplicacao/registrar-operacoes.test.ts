import { describe, expect, it } from 'vitest';

import { registrarOperacoes } from '../../src/aplicacao/registrar-operacoes.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { err } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { repositorioDeTeste } from '../apoio/repositorio-de-teste.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from '../dominio/construtores.js';

const id = extrair(criarIdDeCarteira('carteira-1'));
const petr4 = extrair(Ticker.criar('PETR4'));
const compra = umaCompra({
  data: '2026-02-02',
  quantidade: 100,
  precoEmCentavos: 30_00n,
});

// #region caso-de-uso-registrar-teste
describe('Registrar operações', () => {
  it('grava as operações aceitas e devolve a carteira', async () => {
    const repositorio = repositorioDeTeste();

    const carteira = extrair(
      await registrarOperacoes(repositorio, id, [compra]),
    );

    expect(carteira.quantidadeDe(petr4)).toBe(100n);
    expect(await repositorio.operacoesDe(id)).toEqual([compra]);
  });

  it('não grava nada se a carteira recusa uma operação', async () => {
    const repositorio = repositorioDeTeste();
    const vendaDemais = umaVenda({
      data: '2026-02-03',
      quantidade: 200,
      precoEmCentavos: 31_00n,
    });

    const registro = await registrarOperacoes(repositorio, id, [
      compra,
      vendaDemais,
    ]);

    expect(registro.ok).toBe(false);
    expect(await repositorio.operacoesDe(id)).toEqual([]);
  });

  it('recusa a operação já registrada, pelo id', async () => {
    const repositorio = repositorioDeTeste();
    await registrarOperacoes(repositorio, id, [compra]);

    const deNovo = await registrarOperacoes(repositorio, id, [compra]);

    expect(deNovo).toEqual(
      err({ tipo: 'operacao-repetida', id: compra.id }),
    );
    expect(await repositorio.operacoesDe(id)).toEqual([compra]);
  });

  it('aceita uma operação com outro identificador', async () => {
    const repositorio = repositorioDeTeste();
    const outra = umaCompra({
      id: 'op-002',
      data: '2026-02-02',
      quantidade: 100,
      precoEmCentavos: 30_00n,
    });

    await registrarOperacoes(repositorio, id, [compra]);
    const registro = await registrarOperacoes(repositorio, id, [outra]);

    expect(extrair(registro).quantidadeDe(petr4)).toBe(200n);
  });
});
// #endregion

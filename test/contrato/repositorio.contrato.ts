import { describe, expect, it } from 'vitest';

import type { RepositorioDeCarteiras } from '../../src/aplicacao/portas.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from '../dominio/construtores.js';

const carteira1 = extrair(criarIdDeCarteira('carteira-1'));
const carteira2 = extrair(criarIdDeCarteira('carteira-2'));
const compra = umaCompra({
  id: 'op-1',
  ticker: 'PETR4',
  data: '2026-02-02',
  quantidade: 1_000,
  precoEmCentavos: 22_00n,
  custosEmCentavos: 7_45n,
});
const venda = umaVenda({
  id: 'op-2',
  ticker: 'PETR4',
  data: '2026-04-15',
  quantidade: 400,
  precoEmCentavos: 25_00n,
});
// Um preço acima do maior inteiro exato de um number: um banco que
// passasse os centavos por number perderia o último dígito.
const grande = umaCompra({
  id: 'op-3',
  ticker: 'HGLG11',
  data: '2026-04-16',
  quantidade: 1,
  precoEmCentavos: 9_007_199_254_740_993n,
});

// #region suite-de-contrato
// O que todo repositório de carteiras promete, escrito uma vez. Cada
// adaptador chama a função com uma fábrica que entrega um repositório
// vazio, e os mesmos testes valem para todos, como a suíte de contrato
// das categorias do Capítulo 9.
export function contratoDoRepositorio(
  nome: string,
  criar: () => Promise<RepositorioDeCarteiras>,
): void {
  describe(`Contrato do repositório · ${nome}`, () => {
    it('uma carteira sem operações devolve a lista vazia', async () => {
      const repositorio = await criar();

      expect(await repositorio.operacoesDe(carteira1)).toEqual([]);
    });

    it('devolve as operações na ordem em que entraram', async () => {
      const repositorio = await criar();
      await repositorio.acrescentar(carteira1, [compra]);
      await repositorio.acrescentar(carteira1, [venda, grande]);

      expect(await repositorio.operacoesDe(carteira1)).toEqual([
        compra,
        venda,
        grande,
      ]);
    });

    it('guarda cada carteira à parte', async () => {
      const repositorio = await criar();
      await repositorio.acrescentar(carteira1, [compra]);
      await repositorio.acrescentar(carteira2, [venda]);

      expect(await repositorio.operacoesDe(carteira1)).toEqual([
        compra,
      ]);
      expect(await repositorio.operacoesDe(carteira2)).toEqual([venda]);
    });

    it('acrescentar uma lista vazia não muda nada', async () => {
      const repositorio = await criar();
      await repositorio.acrescentar(carteira1, [compra]);
      await repositorio.acrescentar(carteira1, []);

      expect(await repositorio.operacoesDe(carteira1)).toEqual([
        compra,
      ]);
    });
  });
}
// #endregion

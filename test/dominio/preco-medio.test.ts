import { describe, expect, it } from 'vitest';

import { criarDataDePregao } from '../../src/dominio/data-de-pregao.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeOperacao } from '../../src/dominio/id-de-operacao.js';
import { criarCompra } from '../../src/dominio/operacao.js';
import { Posicao } from '../../src/dominio/posicao.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';

// #region pm-primeira-compra-teste
describe('Posicao.precoMedio', () => {
  it('retorna o preço unitário após abrir com uma compra', () => {
    const compra = extrair(
      criarCompra({
        id: extrair(criarIdDeOperacao('op-001')),
        data: extrair(criarDataDePregao('2026-03-02')),
        ticker: extrair(Ticker.criar('PETR4')),
        quantidade: extrair(Quantidade.criar(200)),
        precoUnitario: Dinheiro.deCentavos(36_20n),
        custos: Dinheiro.deCentavos(0n),
      }),
    );

    const posicao = Posicao.abrir(compra);

    expect(posicao.precoMedio('meio-para-cima')).toEqual(
      Dinheiro.deCentavos(36_20n),
    );
  });
});
// #endregion

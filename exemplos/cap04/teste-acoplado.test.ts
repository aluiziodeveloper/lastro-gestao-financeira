// Teste acoplado à implementação (Capítulo 4). Os dois testes passam
// hoje contra a Posicao do Lastro. O primeiro verifica como a baixa é
// calculada e quebra se ela passar a ser feita de outro jeito, mesmo
// com o mesmo resultado; o segundo verifica só o que o negócio pede.
// Fora da suíte do Lastro:
// npx vitest run -c exemplos/vitest.config.ts

import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { Posicao } from '../../src/dominio/posicao.js';
import { extrair } from '../../test/apoio/resultado.js';
import {
  umaCompra,
  umaVenda,
} from '../../test/dominio/construtores.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function cenaDaCorretora(): Posicao {
  return Posicao.abrir(
    umaCompra({
      quantidade: 300,
      precoEmCentavos: 37_10n,
      custosEmCentavos: 24_00n,
    }),
  );
}

describe('acoplado: verifica o caminho', () => {
  it('multiplica o custo pela venda e divide pela posição', () => {
    const posicao = cenaDaCorretora();
    const multiplicar = vi.spyOn(Dinheiro.prototype, 'multiplicarPor');
    const dividir = vi.spyOn(Dinheiro.prototype, 'dividirPor');

    posicao.vender(
      umaVenda({ quantidade: 70, precoEmCentavos: 41_00n }),
    );

    expect(multiplicar).toHaveBeenCalledTimes(1);
    expect(dividir).toHaveBeenCalledWith(
      expect.anything(),
      'meio-para-cima',
    );
  });
});

describe('comportamento: verifica o resultado', () => {
  it('não muda o preço médio do que resta', () => {
    const posicao = extrair(
      cenaDaCorretora().vender(
        umaVenda({ quantidade: 70, precoEmCentavos: 41_00n }),
      ),
    );

    expect(posicao.precoMedio('meio-para-cima')).toEqual(
      Dinheiro.deCentavos(37_18n),
    );
  });
});

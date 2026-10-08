// O teste que nunca foi vermelho (Capítulo 4). A venda abaixo confere
// a quantidade, esquece a baixa e devolve a posição como estava; o
// teste passa do mesmo jeito, porque o preço médio de quem não vendeu
// nada é igual ao de quem vendeu na proporção certa. Fora da suíte do
// Lastro:
// npx vitest run -c exemplos/vitest.config.ts

import { describe, expect, it } from 'vitest';

interface Posicao {
  readonly quantidade: bigint;
  readonly custoTotalEmCentavos: bigint;
}

function vender(posicao: Posicao, quantidade: bigint): Posicao {
  if (quantidade > posicao.quantidade) {
    throw new Error('venda acima da posição');
  }
  // O defeito: a validação está aqui, mas nenhuma unidade sai e nenhum
  // custo é baixado.
  return posicao;
}

function precoMedioEmCentavos(posicao: Posicao): bigint {
  return posicao.custoTotalEmCentavos / posicao.quantidade;
}

describe('R1 · preço médio · na venda parcial', () => {
  it('não muda o preço médio do que resta', () => {
    const cena: Posicao = {
      quantidade: 300n,
      custoTotalEmCentavos: 11_154_00n,
    };

    const depoisDaVenda = vender(cena, 70n);

    expect(precoMedioEmCentavos(depoisDaVenda)).toBe(37_18n);
  });
});

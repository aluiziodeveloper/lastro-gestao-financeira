import { describe, expect, it } from 'vitest';

import { extrair } from '../apoio/resultado.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { Quantidade } from '../../src/dominio/quantidade.js';

// #region dinheiro-criacao-teste
describe('Dinheiro', () => {
  it('equivale a outro Dinheiro com os mesmos centavos', () => {
    expect(Dinheiro.deCentavos(1_15n)).toEqual(
      Dinheiro.deCentavos(115n),
    );
  });

  it('não equivale a um Dinheiro com centavos diferentes', () => {
    expect(Dinheiro.deCentavos(10n)).not.toEqual(
      Dinheiro.deCentavos(20n),
    );
  });

  it('compara por valor com equivaleA, e não por referência', () => {
    const umReal = Dinheiro.deCentavos(1_00n);
    expect(umReal.equivaleA(Dinheiro.deCentavos(1_00n))).toBe(true);
    expect(umReal).not.toBe(Dinheiro.deCentavos(1_00n));
  });
});
// #endregion

// #region dinheiro-somar-subtrair-teste
describe('Dinheiro: soma e subtração', () => {
  it('soma R$ 0,10 e R$ 0,20 sem perder centavos', () => {
    const soma = Dinheiro.deCentavos(10n).somar(
      Dinheiro.deCentavos(20n),
    );
    expect(soma).toEqual(Dinheiro.deCentavos(30n));
  });

  it('subtrai R$ 0,30 de R$ 1,00', () => {
    const diferenca = Dinheiro.deCentavos(1_00n).subtrair(
      Dinheiro.deCentavos(30n),
    );
    expect(diferenca).toEqual(Dinheiro.deCentavos(70n));
  });

  it('chega a valor negativo quando subtrai mais do que tem', () => {
    const diferenca = Dinheiro.deCentavos(10n).subtrair(
      Dinheiro.deCentavos(30n),
    );
    expect(diferenca).toEqual(Dinheiro.deCentavos(-20n));
  });

  it('não altera as parcelas da operação', () => {
    const dezCentavos = Dinheiro.deCentavos(10n);
    dezCentavos.somar(Dinheiro.deCentavos(20n));
    expect(dezCentavos).toEqual(Dinheiro.deCentavos(10n));
  });
});
// #endregion

// #region dinheiro-multiplicar-teste
describe('Dinheiro: multiplicação por quantidade', () => {
  it('vale R$ 115,00 para 100 ações a R$ 1,15', () => {
    const total = Dinheiro.deCentavos(1_15n).multiplicarPor(
      extrair(Quantidade.criar(100)),
    );
    expect(total).toEqual(Dinheiro.deCentavos(115_00n));
  });

  it('continua exato além do maior inteiro exato de um number', () => {
    const total = Dinheiro.deCentavos(1_00n).multiplicarPor(
      extrair(Quantidade.criar(Number.MAX_SAFE_INTEGER)),
    );
    expect(total).toEqual(
      Dinheiro.deCentavos(9_007_199_254_740_991_00n),
    );
  });
});
// #endregion

// #region dinheiro-inspecionar-teste
describe('Dinheiro na mensagem de falha', () => {
  it('mostra os centavos de cada lado da comparação', () => {
    expect(() => {
      expect(Dinheiro.deCentavos(10n)).toEqual(
        Dinheiro.deCentavos(20n),
      );
    }).toThrow(
      'expected Dinheiro(10 centavos) to deeply equal ' +
        'Dinheiro(20 centavos)',
    );
  });
});
// #endregion

// #region dinheiro-dividir-teste
describe('Dinheiro: divisão com arredondamento explícito', () => {
  it.each([
    ['truncar', '2,5 a 2', 5n, 2n],
    ['truncar', '3,5 a 3', 7n, 3n],
    ['truncar', '−2,5 a −2', -5n, -2n],
    ['meio-para-cima', '2,5 a 3', 5n, 3n],
    ['meio-para-cima', '3,5 a 4', 7n, 4n],
    ['meio-para-cima', '−2,5 a −3', -5n, -3n],
    ['meio-par', '2,5 a 2', 5n, 2n],
    ['meio-par', '3,5 a 4', 7n, 4n],
    ['meio-par', '−2,5 a −2', -5n, -2n],
  ] as const)('%s leva %s', (modo, _caso, centavos, esperado) => {
    const metade = Dinheiro.deCentavos(centavos).dividirPor(
      extrair(Quantidade.criar(2)),
      modo,
    );
    expect(metade).toEqual(Dinheiro.deCentavos(esperado));
  });
});
// #endregion

describe('Dinheiro: divisão longe do meio', () => {
  it.each([
    ['truncar', '1,33 a 1', 4n, 1n],
    ['meio-para-cima', '1,33 a 1', 4n, 1n],
    ['meio-par', '1,33 a 1', 4n, 1n],
    ['truncar', '1,67 a 1', 5n, 1n],
    ['meio-para-cima', '1,67 a 2', 5n, 2n],
    ['meio-par', '1,67 a 2', 5n, 2n],
    ['meio-para-cima', '−1,67 a −2', -5n, -2n],
    ['meio-par', '2 a 2', 6n, 2n],
  ] as const)('%s leva %s', (modo, _caso, centavos, esperado) => {
    const terco = Dinheiro.deCentavos(centavos).dividirPor(
      extrair(Quantidade.criar(3)),
      modo,
    );
    expect(terco).toEqual(Dinheiro.deCentavos(esperado));
  });
});

describe('Dinheiro: sinal', () => {
  it.each([
    ['R$ 0,01', 1n, true, false],
    ['zero', 0n, false, false],
    ['−R$ 0,01', -1n, false, true],
  ])(
    '%s: positivo %s, negativo %s',
    (_valor, centavos, positivo, negativo) => {
      const valor = Dinheiro.deCentavos(centavos);
      expect(valor.ehPositivo()).toBe(positivo);
      expect(valor.ehNegativo()).toBe(negativo);
    },
  );
});

describe('Dinheiro: multiplicação por fração', () => {
  it('multiplica antes de dividir e arredonda uma vez', () => {
    expect(
      Dinheiro.deCentavos(1_00n).multiplicarPorFracao(
        2n,
        3n,
        'meio-para-cima',
      ),
    ).toEqual(Dinheiro.deCentavos(67n));
  });

  it('respeita o modo de arredondamento', () => {
    expect(
      Dinheiro.deCentavos(1_00n).multiplicarPorFracao(
        2n,
        3n,
        'truncar',
      ),
    ).toEqual(Dinheiro.deCentavos(66n));
  });
});

describe('Dinheiro: excede', () => {
  const limite = Dinheiro.deCentavos(20_000_00n);

  it('excede o limite com um centavo a mais', () => {
    expect(Dinheiro.deCentavos(20_000_01n).excede(limite)).toBe(true);
  });

  it('não excede o limite com o valor exato', () => {
    expect(Dinheiro.deCentavos(20_000_00n).excede(limite)).toBe(false);
  });

  it('não excede o limite com um valor menor', () => {
    expect(Dinheiro.deCentavos(10_000_00n).excede(limite)).toBe(false);
  });
});

// #region dinheiro-em-reais-teste
describe('Dinheiro: em reais', () => {
  it.each([
    [0n, 'R$ 0,00'],
    [5n, 'R$ 0,05'],
    [7_32n, 'R$ 7,32'],
    [999_99n, 'R$ 999,99'],
    [1_000_00n, 'R$ 1.000,00'],
    [1_234_56n, 'R$ 1.234,56'],
    [12_345_678_90n, 'R$ 12.345.678,90'],
    [-3_000_00n, '-R$ 3.000,00'],
  ])('%s centavos: %s', (centavos, texto) => {
    expect(Dinheiro.deCentavos(centavos).emReais()).toBe(texto);
  });
});
// #endregion

describe('Dinheiro: unidades e razão', () => {
  it('multiplica por unidades, inclusive zero', () => {
    const preco = Dinheiro.deCentavos(160_00n);

    expect(preco.multiplicarPorUnidades(150n)).toEqual(
      Dinheiro.deCentavos(24_000_00n),
    );
    expect(preco.multiplicarPorUnidades(0n)).toEqual(
      Dinheiro.deCentavos(0n),
    );
  });

  it.each([
    [1_980_00n, 24_000_00n, 825n],
    [1_200_00n, 14_400_00n, 833n],
    [1n, 200_00n, 1n],
  ])(
    '%i centavos de %i são %i partes de 10.000',
    (valor, total, partes) => {
      const razao = Dinheiro.deCentavos(valor).razaoSobre(
        Dinheiro.deCentavos(total),
        10_000n,
        'meio-para-cima',
      );

      expect(razao).toBe(partes);
    },
  );

  it('a razão segue o modo pedido', () => {
    const meio = Dinheiro.deCentavos(1n).razaoSobre(
      Dinheiro.deCentavos(200_00n),
      10_000n,
      'truncar',
    );

    expect(meio).toBe(0n);
  });
});

import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { ratearCustos } from '../../src/dominio/rateio.js';

// #region rateio-teste
function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

function somar(partes: readonly Dinheiro[]): Dinheiro {
  return partes.reduce((total, parte) => total.somar(parte), reais(0n));
}

// A forma de distribuir o centavo que sobra é da solução; o teste exige
// só que cada parte exista e fique entre o piso e o teto da proporção
// exata.
function estaEntre(
  parte: Dinheiro | undefined,
  piso: Dinheiro,
  teto: Dinheiro,
): boolean {
  return (
    parte !== undefined &&
    !parte.subtrair(piso).ehNegativo() &&
    !teto.subtrair(parte).ehNegativo()
  );
}

describe('rateio dos custos da nota', () => {
  it('dá todo o custo à única operação da nota', () => {
    expect(ratearCustos(reais(10_85n), [reais(7_240_00n)])).toEqual([
      reais(10_85n),
    ]);
  });

  it('reparte na proporção exata do valor de cada operação', () => {
    expect(
      ratearCustos(reais(20_00n), [reais(6_000_00n), reais(2_000_00n)]),
    ).toEqual([reais(15_00n), reais(5_00n)]);
  });

  it('distribui o centavo que o arredondamento deixaria sobrar', () => {
    const iguais = reais(1_000_00n);

    const partes = ratearCustos(reais(10n), [iguais, iguais, iguais]);

    expect(partes).toHaveLength(3);
    expect(somar(partes)).toEqual(reais(10n));
    for (const parte of partes) {
      expect(estaEntre(parte, reais(3n), reais(4n))).toBe(true);
    }
  });

  it('não cobra o centavo que o arredondamento faria faltar', () => {
    const iguais = reais(1_000_00n);

    const partes = ratearCustos(reais(2n), [iguais, iguais, iguais]);

    expect(partes).toHaveLength(3);
    expect(somar(partes)).toEqual(reais(2n));
    for (const parte of partes) {
      expect(estaEntre(parte, reais(0n), reais(1n))).toBe(true);
    }
  });

  it('mantém a proporção quando os valores são diferentes', () => {
    const partes = ratearCustos(reais(1_00n), [
      reais(1_00n),
      reais(2_00n),
      reais(4_00n),
    ]);

    expect(partes).toHaveLength(3);
    expect(somar(partes)).toEqual(reais(1_00n));
    expect(estaEntre(partes[0], reais(14n), reais(15n))).toBe(true);
    expect(estaEntre(partes[1], reais(28n), reais(29n))).toBe(true);
    expect(estaEntre(partes[2], reais(57n), reais(58n))).toBe(true);
  });

  it('reparte custos zerados em partes zeradas', () => {
    expect(
      ratearCustos(reais(0n), [reais(7_240_00n), reais(3_890_00n)]),
    ).toEqual([reais(0n), reais(0n)]);
  });
});
// #endregion

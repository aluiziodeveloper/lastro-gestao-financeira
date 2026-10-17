import type { Marcado } from '../marca.js';

// #region pontos-base
// Um ponto-base é um centésimo de ponto percentual: 825 pontos-base
// são 8,25%. O inteiro deixa a vírgula para a hora de mostrar.
export type PontosBase = Marcado<bigint, 'PontosBase'>;

// Qualquer inteiro é uma quantidade de pontos-base; quem precisa de
// limites, como a alocação-alvo, os confere. Só este módulo aplica a
// marca.
export function pontosBase(valor: bigint): PontosBase {
  return valor as PontosBase;
}

// Cem por cento, em pontos-base.
export const cemPorCento = pontosBase(10_000n);
// #endregion

// #region pontos-base-em-percentual
// 825 pontos-base se leem 8,25%; 60, 0,60%.
export function emPercentual(pontos: PontosBase): string {
  const inteiros = String(pontos / 100n);
  const centesimos = String(pontos % 100n).padStart(2, '0');
  return `${inteiros},${centesimos}%`;
}
// #endregion

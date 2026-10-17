import type { Marcado } from '../marca.js';

// #region pontos-base
// Um ponto-base é um centésimo de ponto percentual: 825 pontos-base
// são 8,25%. O inteiro deixa a vírgula para a hora de mostrar.
export type PontosBase = Marcado<bigint, 'PontosBase'>;

// Cem por cento, em pontos-base.
export const cemPorCento = 10_000n as PontosBase;
// #endregion

// #region pontos-base-em-percentual
// 825 pontos-base se leem 8,25%; 60, 0,60%.
export function emPercentual(pontos: PontosBase): string {
  const inteiros = String(pontos / 100n);
  const centesimos = String(pontos % 100n).padStart(2, '0');
  return `${inteiros},${centesimos}%`;
}
// #endregion

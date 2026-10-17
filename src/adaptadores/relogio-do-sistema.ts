import type { Relogio } from '../dominio/relogio.js';

// #region relogio-do-sistema
// O adaptador do relógio do sistema: o único lugar do Lastro que lê a
// hora da máquina. Cada chamada devolve um Date novo.
export const relogioDoSistema: Relogio = {
  agora: () => new Date(),
};
// #endregion

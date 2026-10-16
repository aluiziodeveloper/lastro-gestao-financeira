import {
  criarDataDoCalendario,
  type DataDoCalendario,
  type ErroDeDataDoCalendario,
} from './data-do-calendario.js';

// #region data-de-pregao
// A data de pregão é um dia do calendário com o nome que a nota de
// corretagem usa. O apelido não cria um tipo novo: quem já recebia uma
// DataDePregao continua recebendo, sem mudar nada.
export type DataDePregao = DataDoCalendario;

export type ErroDeDataDePregao = ErroDeDataDoCalendario;

export const criarDataDePregao = criarDataDoCalendario;
// #endregion

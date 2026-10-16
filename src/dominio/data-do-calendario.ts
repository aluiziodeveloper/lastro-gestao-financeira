import type { Marcado } from './marca.js';
import { err, ok, type Result } from './resultado.js';

// #region data-do-calendario
// Um dia do calendário, sem hora e sem fuso: o pregão de uma nota, o
// pagamento de um provento, o início dos efeitos de uma lei. Fins de
// semana e feriados não são verificados.
export type DataDoCalendario = Marcado<string, 'DataDoCalendario'>;

export type ErroDeDataDoCalendario =
  | { readonly tipo: 'data-fora-do-formato'; readonly texto: string }
  | { readonly tipo: 'data-inexistente'; readonly texto: string };

const formatoIso = /^(\d{4})-(\d{2})-(\d{2})$/;

export function criarDataDoCalendario(
  texto: string,
): Result<DataDoCalendario, ErroDeDataDoCalendario> {
  const partes = formatoIso.exec(texto);
  if (partes === null) {
    return err({ tipo: 'data-fora-do-formato', texto });
  }
  const [, ano = 0, mes = 0, dia = 0] = partes.map(Number);
  if (!existeNoCalendario(ano, mes, dia)) {
    return err({ tipo: 'data-inexistente', texto });
  }
  return ok(texto as DataDoCalendario);
}
// #endregion

// #region primeiro-dia-do-mes-seguinte
// O dia 1 do mês seguinte ao da data. O Date.UTC conta os meses a
// partir de 0: o número do mês, usado como índice, já aponta para o
// seguinte, e dezembro vira o janeiro do ano seguinte. A data sai do
// próprio calendário, e por isso é válida sem passar pela validação:
// como no construtor, só este módulo aplica a marca.
export function primeiroDiaDoMesSeguinte(
  data: DataDoCalendario,
): DataDoCalendario {
  const ano = Number(data.slice(0, 4));
  const mes = Number(data.slice(5, 7));
  const seguinte = new Date(Date.UTC(ano, mes, 1));
  return seguinte.toISOString().slice(0, 10) as DataDoCalendario;
}
// #endregion

function existeNoCalendario(
  ano: number,
  mes: number,
  dia: number,
): boolean {
  return (
    mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasNoMes(ano, mes)
  );
}

function diasNoMes(ano: number, mes: number): number {
  if (mes === 2) {
    const bissexto =
      (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
    return bissexto ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

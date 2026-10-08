import type { Marcado } from './marca.js';
import { err, ok, type Result } from './resultado.js';

// #region data-de-pregao
// Um dia do calendário, como a nota de corretagem o informa: sem hora e
// sem fuso. Fins de semana e feriados não são verificados.
export type DataDePregao = Marcado<string, 'DataDePregao'>;

export type ErroDeDataDePregao =
  | { readonly tipo: 'data-fora-do-formato'; readonly texto: string }
  | { readonly tipo: 'data-inexistente'; readonly texto: string };

const formatoIso = /^(\d{4})-(\d{2})-(\d{2})$/;

export function criarDataDePregao(
  texto: string,
): Result<DataDePregao, ErroDeDataDePregao> {
  const partes = formatoIso.exec(texto);
  if (partes === null) {
    return err({ tipo: 'data-fora-do-formato', texto });
  }
  const [, ano = 0, mes = 0, dia = 0] = partes.map(Number);
  if (!existeNoCalendario(ano, mes, dia)) {
    return err({ tipo: 'data-inexistente', texto });
  }
  return ok(texto as DataDePregao);
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

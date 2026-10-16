import type { DadosDeReferencia } from '../dados-de-referencia.js';
import { ok, type Result } from '../resultado.js';
import type { Dividendo, Provento } from './provento.js';
import { dividendosDoAno } from './resumo-dos-dividendos.js';
import {
  type ResumoDoAno,
  resumoVazio,
  somar,
  zero,
} from './totais-do-ano.js';
import {
  type ErroDeProvento,
  tratarProvento,
} from './tratar-provento.js';

// #region resumo-do-ano
// Desafio do Capítulo 10: os proventos pagos num ano, somados por
// tratamento fiscal. Cada provento tem o seu tratamento, menos o
// dividendo: a retenção é do mês e da empresa, e não do pagamento.
export function resumoDoAno(
  proventos: readonly Provento[],
  ano: number,
  referencias: DadosDeReferencia,
): Result<ResumoDoAno, ErroDeProvento> {
  const doAno = proventos.filter(
    ({ pagamento }) => pagamento.slice(0, 4) === String(ano),
  );
  const resumo = dosOutrosProventos(doAno, referencias);
  if (!resumo.ok) {
    return resumo;
  }
  const dividendos = doAno.filter(
    (provento) => provento.tipo === 'dividendo',
  );
  return comOsDividendos(resumo.valor, dividendos, referencias);
}
// #endregion

function dosOutrosProventos(
  doAno: readonly Provento[],
  referencias: DadosDeReferencia,
): Result<ResumoDoAno, ErroDeProvento> {
  return doAno
    .filter((provento) => provento.tipo !== 'dividendo')
    .reduce<Result<ResumoDoAno, ErroDeProvento>>(
      (parcial, provento) =>
        parcial.ok
          ? comOTratamento(parcial.valor, provento, referencias)
          : parcial,
      ok(resumoVazio),
    );
}

function comOsDividendos(
  resumo: ResumoDoAno,
  dividendos: readonly Dividendo[],
  referencias: DadosDeReferencia,
): Result<ResumoDoAno, ErroDeProvento> {
  const doAno = dividendosDoAno(dividendos, referencias);
  if (!doAno.ok) {
    return doAno;
  }
  const { isentos, antecipados, retido } = doAno.valor;
  const comAntecipacao = somar(
    resumo,
    'retido-por-antecipacao',
    antecipados,
    retido,
  );
  return ok(somar(comAntecipacao, 'isento', isentos, zero));
}

function comOTratamento(
  resumo: ResumoDoAno,
  provento: Provento,
  referencias: DadosDeReferencia,
): Result<ResumoDoAno, ErroDeProvento> {
  const tratado = tratarProvento(provento, referencias);
  if (!tratado.ok) {
    return tratado;
  }
  const { tratamento, retido } = tratado.valor;
  return ok(somar(resumo, tratamento, provento.bruto, retido));
}

export type { ResumoDoAno, TotaisDoAno } from './totais-do-ano.js';

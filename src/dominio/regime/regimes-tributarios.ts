import type { DataDoCalendario } from '../data-do-calendario.js';
import { err, ok, type Result } from '../resultado.js';
import {
  type DefinicaoDeRegime,
  definirRegimes,
  type ErroDeDefinicao,
  type RegimeTributario,
} from './regime-tributario.js';

export type ErroDeRegimes =
  | ErroDeDefinicao
  | { readonly tipo: 'inicio-fora-do-dia-1'; readonly regime: string }
  | {
      readonly tipo: 'regimes-sobrepostos' | 'lacuna-entre-regimes';
      readonly anterior: string;
      readonly seguinte: string;
    };

export interface ErroSemRegime {
  readonly tipo: 'sem-regime-vigente';
  readonly data: DataDoCalendario;
}

// #region resolver-regime
// O conjunto dos regimes cobre o tempo sem lacuna e sem sobreposição,
// conferido uma vez, na construção. Daí em diante, toda data a partir
// do primeiro início tem um regime, e um só.
export class RegimesTributarios {
  readonly #regimes: readonly RegimeTributario[];

  private constructor(regimes: readonly RegimeTributario[]) {
    this.#regimes = regimes;
  }

  static criar(
    definicoes: readonly DefinicaoDeRegime[],
  ): Result<RegimesTributarios, ErroDeRegimes> {
    const regimes = definirRegimes(definicoes);
    if (!regimes.ok) {
      return regimes;
    }
    const ordenados = regimes.valor.toSorted((um, outro) =>
      um.vigencia.comecaAntesDe(outro.vigencia) ? -1 : 1,
    );
    const erro = erroDeSequencia(ordenados);
    return erro === undefined
      ? ok(new RegimesTributarios(ordenados))
      : err(erro);
  }

  vigenteEm(
    data: DataDoCalendario,
  ): Result<RegimeTributario, ErroSemRegime> {
    const regime = this.#regimes.find(({ vigencia }) =>
      vigencia.contem(data),
    );
    return regime === undefined
      ? err({ tipo: 'sem-regime-vigente', data })
      : ok(regime);
  }
}
// #endregion

// #region sequencia-de-regimes
// A apuração é mensal: todo regime começa no dia 1. Na ordem do
// calendário, cada regime termina exatamente onde o seguinte começa.
function erroDeSequencia(
  ordenados: readonly RegimeTributario[],
): ErroDeRegimes | undefined {
  const foraDoDia1 = ordenados.find(
    ({ vigencia }) => !vigencia.comecaNoDia1(),
  );
  if (foraDoDia1 !== undefined) {
    return { tipo: 'inicio-fora-do-dia-1', regime: foraDoDia1.nome };
  }
  const [primeiro, ...seguintes] = ordenados;
  if (primeiro === undefined) {
    return undefined;
  }
  const ultimo = seguintes.reduce<
    Result<RegimeTributario, ErroDeRegimes>
  >(
    (anterior, seguinte) =>
      anterior.ok ? ligar(anterior.valor, seguinte) : anterior,
    ok(primeiro),
  );
  return ultimo.ok ? undefined : ultimo.erro;
}

function ligar(
  anterior: RegimeTributario,
  seguinte: RegimeTributario,
): Result<RegimeTributario, ErroDeRegimes> {
  const ligacao = anterior.vigencia.ligacaoCom(seguinte.vigencia);
  if (ligacao === 'contiguas') {
    return ok(seguinte);
  }
  const nomes = { anterior: anterior.nome, seguinte: seguinte.nome };
  return ligacao === 'sobrepostas'
    ? err({ tipo: 'regimes-sobrepostos', ...nomes })
    : err({ tipo: 'lacuna-entre-regimes', ...nomes });
}
// #endregion

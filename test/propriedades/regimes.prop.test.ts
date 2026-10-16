import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import type { DefinicaoDeRegime } from '../../src/dominio/regime/regime-tributario.js';
import { definicoesDoLastro } from '../../src/dominio/regime/regimes.js';
import { RegimesTributarios } from '../../src/dominio/regime/regimes-tributarios.js';
import { extrair } from '../apoio/resultado.js';

const [modelo] = definicoesDoLastro as [DefinicaoDeRegime];

// Datas como texto, contadas a partir de 1º/1/2024 em UTC, para que
// o fuso não troque o dia (Capítulo 3).
function primeiroDiaDoMes(meses: number): string {
  return new Date(Date.UTC(2024, meses, 1)).toISOString().slice(0, 10);
}

// O dia 0 de um mês é o último dia do mês anterior.
function vesperaDoMes(meses: number): string {
  return new Date(Date.UTC(2024, meses, 0)).toISOString().slice(0, 10);
}

function diaDepois(dias: number): string {
  return new Date(Date.UTC(2024, 0, 1 + dias))
    .toISOString()
    .slice(0, 10);
}

// De um a seis regimes contíguos, pelos meses em que começam: cada um
// termina onde o seguinte começa, e o último não tem fim.
const mesesDeInicio = fc
  .uniqueArray(fc.integer({ min: 0, max: 120 }), {
    minLength: 1,
    maxLength: 6,
  })
  .map((meses) => meses.toSorted((um, outro) => um - outro));

const inicios = mesesDeInicio.map((meses) =>
  meses.map(primeiroDiaDoMes),
);

// Os regimes e uma data: um dia qualquer ou uma fronteira, o início
// de um regime ou a véspera dele, onde mora o erro de um dia.
const regimesEUmaData = mesesDeInicio.chain((meses) =>
  fc.tuple(
    fc.constant(meses.map(primeiroDiaDoMes)),
    fc.oneof(
      fc.integer({ min: -400, max: 4_000 }).map(diaDepois),
      fc.constantFrom(...meses.map(primeiroDiaDoMes)),
      fc.constantFrom(...meses.map(vesperaDoMes)),
    ),
  ),
);

function contiguos(datas: readonly string[]): DefinicaoDeRegime[] {
  return datas.map((inicio, indice) => {
    const fim = datas[indice + 1];
    const { apuracao, proventos } = modelo;
    const nome = `regime-${String(indice)}`;
    return fim === undefined
      ? { nome, inicio, apuracao, proventos }
      : { nome, inicio, fim, apuracao, proventos };
  });
}

// O modelo de referência: os regimes que cobrem a data, contados nas
// próprias definições, sem passar pelo conjunto.
function queCobrem(
  definicoes: readonly DefinicaoDeRegime[],
  data: string,
): string[] {
  return definicoes
    .filter(
      ({ inicio, fim }) => inicio <= data && (fim ?? '9999') > data,
    )
    .map(({ nome }) => nome);
}

// #region prop-sem-lacuna
describe('Regimes · propriedades da partição do tempo', () => {
  it('toda data a partir do primeiro início tem um regime só', () => {
    fc.assert(
      fc.property(regimesEUmaData, ([datas, texto]) => {
        const definicoes = contiguos(datas);
        const regimes = extrair(RegimesTributarios.criar(definicoes));
        const cobrem = queCobrem(definicoes, texto);
        const vigente = regimes.vigenteEm(
          extrair(criarDataDoCalendario(texto)),
        );

        expect(cobrem.length).toBe(texto < (datas[0] ?? '') ? 0 : 1);
        expect(vigente.ok ? [vigente.valor.nome] : []).toEqual(cobrem);
      }),
    );
  });

  it('tirar um regime do meio abre uma lacuna', () => {
    const tresOuMais = inicios.filter((datas) => datas.length >= 3);
    fc.assert(
      fc.property(tresOuMais, (datas) => {
        const definicoes = contiguos(datas);
        const semOSegundo = definicoes.toSpliced(1, 1);

        expect(RegimesTributarios.criar(semOSegundo)).toMatchObject({
          ok: false,
          erro: { tipo: 'lacuna-entre-regimes' },
        });
      }),
    );
  });
});
// #endregion

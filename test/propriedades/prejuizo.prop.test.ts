import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { NomeDaCategoria } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { categoriasDo } from '../../src/dominio/apuracao/categorias.js';
import type { Lancamento } from '../../src/dominio/apuracao/lancamentos.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { compensar } from '../../src/dominio/prejuizo/compensacao.js';
import {
  type GrupoDeCompensacao,
  grupoDaCategoria,
  PrejuizoAcumulado,
} from '../../src/dominio/prejuizo/prejuizo-acumulado.js';
import { regrasEm } from '../dominio/referencias.js';

const categorias = categoriasDo(regrasEm('2026-01-01'));
const nomes: readonly NomeDaCategoria[] = [
  'acoes-comum',
  'day-trade',
  'fii',
  'etf',
];
const grupos: readonly GrupoDeCompensacao[] = [
  'comum',
  'day-trade',
  'fii',
];

// Um mês com até seis vendas, de qualquer categoria, com lucro ou
// prejuízo; um ano com até doze meses. O gerador sorteia centavos, e
// os lançamentos nascem dentro da propriedade, como no Capítulo 7:
// assim o contraexemplo mostra números, e não {}.
const umaVenda = fc.record({
  categoria: fc.constantFrom(...nomes),
  totalVendido: fc.bigInt({ min: 0n, max: 100_000_00n }),
  resultado: fc.bigInt({ min: -20_000_00n, max: 20_000_00n }),
});
const umAno = fc.array(fc.array(umaVenda, { maxLength: 6 }), {
  maxLength: 12,
});

function lancamentosDe(
  vendas: readonly {
    categoria: NomeDaCategoria;
    totalVendido: bigint;
    resultado: bigint;
  }[],
): readonly Lancamento[] {
  return vendas.map(({ categoria, totalVendido, resultado }) => ({
    categoria,
    totalVendido: Dinheiro.deCentavos(totalVendido),
    resultado: Dinheiro.deCentavos(resultado),
  }));
}

const zero = Dinheiro.deCentavos(0n);

// O prejuízo de um grupo num mês: a soma das categorias do grupo que
// fecharam o mês no negativo.
function perdaDoMes(
  lancamentos: readonly Lancamento[],
  grupo: GrupoDeCompensacao,
): Dinheiro {
  return nomes
    .filter((nome) => grupoDaCategoria[nome] === grupo)
    .map((nome) =>
      lancamentos
        .filter(({ categoria }) => categoria === nome)
        .reduce((total, { resultado }) => total.somar(resultado), zero),
    )
    .filter((resultado) => resultado.ehNegativo())
    .reduce((total, resultado) => total.subtrair(resultado), zero);
}

// #region prop-conservacao
// A conservação do prejuízo: em cada grupo, o que se perdeu no ano é
// o que se compensou mais o que sobra. Nenhum prejuízo some, nenhum
// nasce do nada, e o que se compensa nunca passa do que se perdeu.
describe('Prejuízo · propriedades', () => {
  it('perdido = compensado + saldo final, em cada grupo', () => {
    fc.assert(
      fc.property(umAno, (sorteio) => {
        const meses = sorteio.map(lancamentosDe);
        const inicio = {
          prejuizo: PrejuizoAcumulado.nenhum(),
          compensado: new Map(grupos.map((grupo) => [grupo, zero])),
        };
        const fim = meses.reduce(
          ({ prejuizo, compensado }, lancamentos) => {
            const mes = compensar(categorias, lancamentos, prejuizo);
            const somado = new Map(compensado);
            for (const {
              categoria,
              compensado: doMes,
            } of mes.categorias) {
              const grupo = grupoDaCategoria[categoria];
              somado.set(
                grupo,
                (somado.get(grupo) ?? zero).somar(doMes),
              );
            }
            return { prejuizo: mes.prejuizo, compensado: somado };
          },
          inicio,
        );

        for (const grupo of grupos) {
          const perdido = meses
            .map((lancamentos) => perdaDoMes(lancamentos, grupo))
            .reduce((total, perda) => total.somar(perda), zero);
          const compensado = fim.compensado.get(grupo) ?? zero;
          expect(compensado.somar(fim.prejuizo.saldoDe(grupo))).toEqual(
            perdido,
          );
          expect(compensado.excede(perdido)).toBe(false);
        }
      }),
    );
  });
});
// #endregion

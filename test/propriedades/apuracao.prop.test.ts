import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { CategoriaDeApuracao } from '../../src/dominio/apuracao/categoria.js';
import { categoriasDoMes } from '../../src/dominio/apuracao/categorias.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';

const umValor = (min: bigint, max: bigint) =>
  fc
    .bigInt({ min, max })
    .map((centavos) => Dinheiro.deCentavos(centavos));

const ateOLimite = umValor(0n, 20_000_00n);
const acimaDoLimite = umValor(20_000_01n, 1_000_000_00n);
const umResultado = umValor(-50_000_00n, 50_000_00n);

// Sem a categoria, as propriedades passariam sem testar nada: o teste
// falha em vez de comparar valores ausentes.
function categoriaDeAcoes(): CategoriaDeApuracao {
  const acoes = categoriasDoMes.find(
    (categoria) => categoria.nome === 'acoes-comum',
  );
  if (acoes === undefined) {
    throw new Error('Categoria de ações ausente');
  }
  return acoes;
}

const acoes = categoriaDeAcoes();

function impostoDeAcoes(totalVendido: Dinheiro, resultado: Dinheiro) {
  return acoes.apurar({ totalVendido, resultado }).imposto;
}

// #region prop-limiar
// O limite de R$ 20 mil visto como regra de todo o espaço de entradas:
// tudo ou nada, e sem degrau ao contrário.
describe('R4 · isenção de R$ 20 mil · propriedades', () => {
  it('não cobra nada até o limite, qualquer que seja o ganho', () => {
    fc.assert(
      fc.property(ateOLimite, umResultado, (total, resultado) => {
        expect(impostoDeAcoes(total, resultado)).toEqual(
          Dinheiro.deCentavos(0n),
        );
      }),
    );
  });

  it('acima do limite, o imposto não depende do total vendido', () => {
    fc.assert(
      fc.property(
        acimaDoLimite,
        acimaDoLimite,
        umResultado,
        (umTotal, outroTotal, resultado) => {
          expect(impostoDeAcoes(umTotal, resultado)).toEqual(
            impostoDeAcoes(outroTotal, resultado),
          );
        },
      ),
    );
  });

  it('cruzar o limite nunca diminui o imposto', () => {
    fc.assert(
      fc.property(
        ateOLimite,
        acimaDoLimite,
        umResultado,
        (abaixo, acima, resultado) => {
          const antes = impostoDeAcoes(abaixo, resultado);
          const depois = impostoDeAcoes(acima, resultado);
          expect(antes.excede(depois)).toBe(false);
        },
      ),
    );
  });
});
// #endregion

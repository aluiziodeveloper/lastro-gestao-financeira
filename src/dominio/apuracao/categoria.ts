import type { Aliquota } from '../aliquota.js';
import { Dinheiro } from '../dinheiro.js';
import {
  grupoDaCategoria,
  type PrejuizoAcumulado,
} from '../prejuizo/prejuizo-acumulado.js';
import type {
  NomeDaCategoria,
  ResultadoDaCategoria,
  Totais,
} from './apuracao-do-mes.js';

// #region categoria-interface
// Toda categoria cumpre o mesmo contrato: recebe os totais do mês e
// o prejuízo a compensar e devolve o resultado, com a isenção, a
// compensação e o imposto, e o prejuízo que sobra. Quem apura não
// precisa saber qual categoria tem nas mãos.
export interface CategoriaDeApuracao {
  readonly nome: NomeDaCategoria;
  apurar(totais: Totais, prejuizo: PrejuizoAcumulado): CategoriaApurada;
}

export interface CategoriaApurada {
  readonly apurado: ResultadoDaCategoria;
  readonly prejuizo: PrejuizoAcumulado;
}

export interface PoliticaDeIsencao {
  isenta(totais: Totais): boolean;
}
// #endregion

const zero = Dinheiro.deCentavos(0n);

// #region categoria-composta
// Uma categoria é composta, e não herdada: o nome, a alíquota e a
// política de isenção são peças que se combinam. As peças agem nesta
// ordem: a isenção decide se há ganho a tributar; o ganho tributável
// consome o prejuízo do grupo; a alíquota incide sobre o que sobra.
export function categoria(
  nome: NomeDaCategoria,
  aliquota: Aliquota,
  isencao: PoliticaDeIsencao,
): CategoriaDeApuracao {
  const pecas = { nome, aliquota, isencao };
  return {
    nome,
    apurar: (totais, prejuizo) => apurarComAs(pecas, totais, prejuizo),
  };
}

interface Pecas {
  readonly nome: NomeDaCategoria;
  readonly aliquota: Aliquota;
  readonly isencao: PoliticaDeIsencao;
}

function apurarComAs(
  { nome, aliquota, isencao }: Pecas,
  totais: Totais,
  anterior: PrejuizoAcumulado,
): CategoriaApurada {
  const isenta = isencao.isenta(totais);
  const ganho = isenta ? zero : ganhoDe(totais.resultado);
  const { compensado, prejuizo } = anterior.compensar(
    grupoDaCategoria[nome],
    ganho,
  );
  const base = ganho.subtrair(compensado);
  const imposto = aliquota.sobreGanho(base);
  return {
    apurado: {
      categoria: nome,
      ...totais,
      isenta,
      compensado,
      base,
      imposto,
    },
    prejuizo,
  };
}

// Prejuízo não é ganho: a parte tributável de um resultado negativo é
// zero.
function ganhoDe(resultado: Dinheiro): Dinheiro {
  return resultado.ehPositivo() ? resultado : zero;
}

export const semIsencao: PoliticaDeIsencao = { isenta: () => false };

// Isento se o total vendido no mês não passa do limite: tudo ou nada.
export function isencaoAte(limite: Dinheiro): PoliticaDeIsencao {
  return { isenta: ({ totalVendido }) => !totalVendido.excede(limite) };
}
// #endregion

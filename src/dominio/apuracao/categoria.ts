import type { Aliquota } from '../aliquota.js';
import { Dinheiro } from '../dinheiro.js';
import type {
  NomeDaCategoria,
  ResultadoDaCategoria,
  Totais,
} from './apuracao-do-mes.js';

// #region categoria-interface
// Toda categoria cumpre o mesmo contrato: recebe os totais do mês e
// devolve o resultado, com a isenção e o imposto. Quem apura não
// precisa saber qual categoria tem nas mãos.
export interface CategoriaDeApuracao {
  readonly nome: NomeDaCategoria;
  apurar(totais: Totais): ResultadoDaCategoria;
}

export interface PoliticaDeIsencao {
  isenta(totais: Totais): boolean;
}
// #endregion

const zero = Dinheiro.deCentavos(0n);

// #region categoria-composta
// Uma categoria é composta, e não herdada: o nome, a alíquota e a
// política de isenção são peças que se combinam.
export function categoria(
  nome: NomeDaCategoria,
  aliquota: Aliquota,
  isencao: PoliticaDeIsencao,
): CategoriaDeApuracao {
  return {
    nome,
    apurar(totais) {
      const isenta = isencao.isenta(totais);
      const imposto = isenta
        ? zero
        : aliquota.sobreGanho(totais.resultado);
      return { categoria: nome, ...totais, isenta, imposto };
    },
  };
}

export const semIsencao: PoliticaDeIsencao = { isenta: () => false };

// Isento se o total vendido no mês não passa do limite: tudo ou nada.
export function isencaoAte(limite: Dinheiro): PoliticaDeIsencao {
  return { isenta: ({ totalVendido }) => !totalVendido.excede(limite) };
}
// #endregion

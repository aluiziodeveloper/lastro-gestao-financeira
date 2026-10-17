import type { MesDeApuracao } from '../apuracao/mes-de-apuracao.js';
import type { Carteira } from '../carteira.js';
import type { Dinheiro } from '../dinheiro.js';
import { type Provento, unidadesDe } from '../proventos/provento.js';
import {
  projetarRenda,
  type RendaProjetada,
} from './renda-projetada.js';

// A regra que separa um provento extraordinário dos outros: ele é
// extraordinário quando o seu valor por unidade passa de um múltiplo
// da mediana dos outros do mesmo ativo na janela.
export interface RegraDeExtraordinario {
  readonly multiploDaMediana: bigint;
}

export const maisDoDobroDaMediana: RegraDeExtraordinario = {
  multiploDaMediana: 2n,
};

// #region sem-extraordinarios
// Desafio do Capítulo 12: a projeção sem os proventos extraordinários
// da janela. A comparação dos valores por unidade é por multiplicação
// cruzada, sem dividir. Os testes estão em
// test/dominio/sem-extraordinarios.test.ts.
export function projetarSemExtraordinarios(
  proventos: readonly Provento[],
  carteira: Carteira,
  mesCorrente: MesDeApuracao,
  regra: RegraDeExtraordinario,
): RendaProjetada {
  const janela = Array.from({ length: 12 }, (_, indice) =>
    mesCorrente.deslocado(indice - 12),
  );
  const daJanela = proventos.filter((provento) =>
    janela.some((mes) => mes.contem(provento.pagamento)),
  );
  const comuns = daJanela.filter(
    (provento) => !ehExtraordinario(provento, daJanela, regra),
  );
  return projetarRenda(comuns, carteira, mesCorrente);
}

// O valor por unidade como fração: o que foi pago sobre as unidades
// que receberam, sem dividir.
interface PorUnidade {
  readonly valor: Dinheiro;
  readonly unidades: bigint;
}

function porUnidade(provento: Provento): PorUnidade {
  const unidades = unidadesDe(provento).paraBigInt();
  return { valor: provento.bruto, unidades };
}

// a/b passa de c/d quando a × d passa de c × b: as unidades são
// positivas, e a comparação não arredonda nada.
function passaDe(uma: PorUnidade, outra: PorUnidade): boolean {
  return uma.valor
    .multiplicarPorUnidades(outra.unidades)
    .excede(outra.valor.multiplicarPorUnidades(uma.unidades));
}

function ehExtraordinario(
  provento: Provento,
  daJanela: readonly Provento[],
  regra: RegraDeExtraordinario,
): boolean {
  const outros = daJanela
    .filter((outro) => outro !== provento)
    .filter((outro) => outro.ticker.equivaleA(provento.ticker))
    .map(porUnidade);
  const mediana = medianaDe(outros);
  if (mediana === undefined) {
    return false;
  }
  const limite = {
    valor: mediana.valor.multiplicarPorUnidades(
      regra.multiploDaMediana,
    ),
    unidades: mediana.unidades,
  };
  return passaDe(porUnidade(provento), limite);
}

// Com um número par de valores, a mediana é a média dos dois do meio:
// (a/b + c/d) ÷ 2 = (a × d + c × b) / (2 × b × d).
function medianaDe(
  valores: readonly PorUnidade[],
): PorUnidade | undefined {
  const ordenados = valores.toSorted(comparar);
  const meio = Math.floor(ordenados.length / 2);
  const depois = ordenados[meio];
  if (depois === undefined || ordenados.length % 2 === 1) {
    return depois;
  }
  const antes = ordenados[meio - 1] ?? depois;
  return {
    valor: antes.valor
      .multiplicarPorUnidades(depois.unidades)
      .somar(depois.valor.multiplicarPorUnidades(antes.unidades)),
    unidades: 2n * antes.unidades * depois.unidades,
  };
}

// 1 quando a primeira passa da outra, −1 quando fica abaixo, 0 quando
// empatam: o que o toSorted espera de um comparador.
function comparar(uma: PorUnidade, outra: PorUnidade): number {
  return Number(passaDe(uma, outra)) - Number(passaDe(outra, uma));
}
// #endregion

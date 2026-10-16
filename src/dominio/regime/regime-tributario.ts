import type { Aliquota } from '../aliquota.js';
import type { NomeDaCategoria } from '../apuracao/apuracao-do-mes.js';
import {
  criarDataDoCalendario,
  type ErroDeDataDoCalendario,
} from '../data-do-calendario.js';
import type { Dinheiro } from '../dinheiro.js';
import { ok, type Result } from '../resultado.js';
import { type ErroDeVigencia, Vigencia } from '../vigencia.js';

// #region regime
// Um regime tributário é a lei de um período escrita como dado. O que
// muda de uma lei para outra são valores, e não o cálculo: um regime
// novo é um objeto a mais, e quem calcula não muda.
export interface RegraDeApuracao {
  readonly aliquota: Aliquota;
  // Limite do total vendido no mês; sem ele, a categoria não é isenta.
  readonly isencaoAte?: Dinheiro;
}

export type RegrasDeApuracao = Readonly<
  Record<NomeDaCategoria, RegraDeApuracao>
>;

// Uma fração exata, como 10/100 para 10% das cotas emitidas.
export interface Fracao {
  readonly numerador: bigint;
  readonly denominador: bigint;
}

// O que o fundo e o investidor cumprem para que os rendimentos sejam
// isentos; sem isso, a fonte retém pela alíquota.
export interface RequisitosDaIsencaoDoFii {
  readonly minimoDeCotistas: number;
  readonly participacaoAbaixoDe: Fracao;
  readonly aliquotaSemIsencao: Aliquota;
}

// A retenção na fonte de cada provento, pela data do pagamento.
export interface RegrasDeProventos {
  readonly jcp: Aliquota;
  readonly fii: RequisitosDaIsencaoDoFii;
}

export interface RegimeTributario {
  readonly nome: string;
  readonly vigencia: Vigencia;
  readonly apuracao: RegrasDeApuracao;
  readonly proventos: RegrasDeProventos;
}

// A definição é o regime como a lei o escreve, com as datas em texto.
// Sem fim, o regime vale daí em diante.
export interface DefinicaoDeRegime {
  readonly nome: string;
  readonly inicio: string;
  readonly fim?: string;
  readonly apuracao: RegrasDeApuracao;
  readonly proventos: RegrasDeProventos;
}
// #endregion

export type ErroDeDefinicao = ErroDeDataDoCalendario | ErroDeVigencia;

export function definirRegime(
  definicao: DefinicaoDeRegime,
): Result<RegimeTributario, ErroDeDefinicao> {
  const { nome, inicio, fim, apuracao, proventos } = definicao;
  const vigencia = vigenciaDe(inicio, fim);
  if (!vigencia.ok) {
    return vigencia;
  }
  return ok({ nome, vigencia: vigencia.valor, apuracao, proventos });
}

// Define todos os regimes, ou devolve o erro do primeiro que falhar.
export function definirRegimes(
  definicoes: readonly DefinicaoDeRegime[],
): Result<readonly RegimeTributario[], ErroDeDefinicao> {
  return definicoes.reduce<
    Result<readonly RegimeTributario[], ErroDeDefinicao>
  >((anteriores, definicao) => {
    if (!anteriores.ok) {
      return anteriores;
    }
    const regime = definirRegime(definicao);
    if (!regime.ok) {
      return regime;
    }
    return ok([...anteriores.valor, regime.valor]);
  }, ok([]));
}

function vigenciaDe(
  inicio: string,
  fim: string | undefined,
): Result<Vigencia, ErroDeDefinicao> {
  const dataDeInicio = criarDataDoCalendario(inicio);
  if (!dataDeInicio.ok) {
    return dataDeInicio;
  }
  if (fim === undefined) {
    return ok(Vigencia.desde(dataDeInicio.valor));
  }
  const dataDeFim = criarDataDoCalendario(fim);
  if (!dataDeFim.ok) {
    return dataDeFim;
  }
  return Vigencia.entre(dataDeInicio.valor, dataDeFim.valor);
}

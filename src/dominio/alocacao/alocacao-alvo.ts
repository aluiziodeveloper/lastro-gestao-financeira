import type { ClasseDeAtivo } from '../classe-de-ativo.js';
import {
  cemPorCento,
  type PontosBase,
  pontosBase,
} from '../mercado/pontos-base.js';
import { inspecionar, type ObjetoDeValor } from '../objeto-de-valor.js';
import { err, ok, type Result } from '../resultado.js';

// #region banda-de-tolerancia
// O alvo de uma classe e a banda em volta dele, em pontos-base: alvo
// de 5.000 com banda de 500 enquadra a classe de 45% a 55%, com os
// dois limites dentro.
export interface Fatia {
  readonly classe: ClasseDeAtivo;
  readonly alvo: PontosBase;
  readonly banda: PontosBase;
}

export interface Limites {
  readonly minimo: bigint;
  readonly maximo: bigint;
}

export function limitesDe({ alvo, banda }: Fatia): Limites {
  return { minimo: alvo - banda, maximo: alvo + banda };
}
// #endregion

// #region alocacao-alvo
export type ErroDeAlocacao =
  | { readonly tipo: 'classe-repetida'; readonly classe: ClasseDeAtivo }
  | { readonly tipo: 'fatia-invalida'; readonly classe: ClasseDeAtivo }
  | { readonly tipo: 'alvos-nao-somam-cem'; readonly soma: bigint };

const nada = pontosBase(0n);

// Quanto a investidora quer em cada classe. Os alvos somam 100%; a
// banda não é negativa nem maior que o alvo; uma classe sem fatia tem
// alvo e banda zero.
export class AlocacaoAlvo implements ObjetoDeValor<AlocacaoAlvo> {
  readonly #fatias: readonly Fatia[];

  private constructor(fatias: readonly Fatia[]) {
    this.#fatias = fatias;
  }

  static criar(
    fatias: readonly Fatia[],
  ): Result<AlocacaoAlvo, ErroDeAlocacao> {
    const repetida = fatias.find(
      (fatia, indice) =>
        fatias.findIndex(({ classe }) => classe === fatia.classe) !==
        indice,
    );
    if (repetida !== undefined) {
      return err({ tipo: 'classe-repetida', classe: repetida.classe });
    }
    const invalida = fatias.find(
      ({ alvo, banda }) => banda < 0n || banda > alvo,
    );
    if (invalida !== undefined) {
      return err({ tipo: 'fatia-invalida', classe: invalida.classe });
    }
    const soma = fatias.reduce((total, { alvo }) => total + alvo, 0n);
    if (soma !== cemPorCento) {
      return err({ tipo: 'alvos-nao-somam-cem', soma });
    }
    return ok(new AlocacaoAlvo(fatias));
  }

  fatias(): readonly Fatia[] {
    return this.#fatias;
  }

  fatiaDe(classe: ClasseDeAtivo): Fatia {
    const fatia = this.#fatias.find((uma) => uma.classe === classe);
    return fatia ?? { classe, alvo: nada, banda: nada };
  }

  // A ordem das fatias não importa: vale o alvo e a banda de cada
  // classe.
  equivaleA(outra: AlocacaoAlvo): boolean {
    return (
      this.#fatias.length === outra.#fatias.length &&
      this.#fatias.every(({ classe, alvo, banda }) => {
        const dela = outra.fatiaDe(classe);
        return dela.alvo === alvo && dela.banda === banda;
      })
    );
  }

  [inspecionar](): string {
    const fatias = this.#fatias.map(
      ({ classe, alvo, banda }) =>
        `${classe} ${String(alvo)}±${String(banda)}`,
    );
    return `AlocacaoAlvo(${fatias.join(', ')})`;
  }
}
// #endregion

import {
  dividirArredondando,
  type ModoDeArredondamento,
} from './arredondamento.js';
import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';
import type { Quantidade } from './quantidade.js';

// #region dinheiro-classe
export class Dinheiro implements ObjetoDeValor<Dinheiro> {
  readonly #centavos: bigint;

  private constructor(centavos: bigint) {
    this.#centavos = centavos;
  }

  static deCentavos(centavos: bigint): Dinheiro {
    return new Dinheiro(centavos);
  }

  equivaleA(outro: Dinheiro): boolean {
    return this.#centavos === outro.#centavos;
  }

  // #region dinheiro-sinal
  ehPositivo(): boolean {
    return this.#centavos > 0n;
  }

  ehNegativo(): boolean {
    return this.#centavos < 0n;
  }
  // #endregion

  // #region dinheiro-inspecionar
  [inspecionar](): string {
    return `Dinheiro(${String(this.#centavos)} centavos)`;
  }
  // #endregion

  // #region dinheiro-somar-subtrair
  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.#centavos + outro.#centavos);
  }

  subtrair(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this.#centavos - outro.#centavos);
  }
  // #endregion

  // #region dinheiro-multiplicar
  multiplicarPor(quantidade: Quantidade): Dinheiro {
    return new Dinheiro(this.#centavos * quantidade.paraBigInt());
  }
  // #endregion

  // #region dinheiro-dividir
  dividirPor(
    divisor: Quantidade,
    modo: ModoDeArredondamento,
  ): Dinheiro {
    return new Dinheiro(
      dividirArredondando(this.#centavos, divisor.paraBigInt(), modo),
    );
  }
  // #endregion

  // #region dinheiro-excede
  excede(limite: Dinheiro): boolean {
    return this.#centavos > limite.#centavos;
  }
  // #endregion

  // #region dinheiro-em-reais
  // O valor como se lê no Brasil: R$ 1.234,56, com o sinal à frente
  // quando é negativo.
  emReais(): string {
    const negativo = this.#centavos < 0n;
    const absoluto = negativo ? -this.#centavos : this.#centavos;
    const reais = agruparMilhares(String(absoluto / 100n));
    const centavos = String(absoluto % 100n).padStart(2, '0');
    return `${negativo ? '-' : ''}R$ ${reais},${centavos}`;
  }
  // #endregion

  // #region dinheiro-multiplicar-por-fracao
  // Multiplica por uma fração exata e arredonda uma vez, no fim: é como
  // a alíquota se aplica ao resultado do mês.
  multiplicarPorFracao(
    numerador: bigint,
    denominador: bigint,
    modo: ModoDeArredondamento,
  ): Dinheiro {
    return new Dinheiro(
      dividirArredondando(
        this.#centavos * numerador,
        denominador,
        modo,
      ),
    );
  }
  // #endregion
}
// #endregion

// #region agrupar-milhares
// Um ponto a cada três dígitos, da direita para a esquerda: os três
// últimos ficam, e o resto passa pela mesma regra até caber em três.
function agruparMilhares(digitos: string): string {
  if (digitos.length <= 3) {
    return digitos;
  }
  const inicio = digitos.slice(0, -3);
  const ultimos = digitos.slice(-3);
  return `${agruparMilhares(inicio)}.${ultimos}`;
}
// #endregion

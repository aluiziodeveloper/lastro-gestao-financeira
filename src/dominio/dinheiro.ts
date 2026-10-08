import {
  dividirArredondando,
  type ModoDeArredondamento,
} from './arredondamento.js';
import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';
import type { Quantidade } from './quantidade.js';

// #region formato-da-nota
// Como na nota de corretagem: milhar com ponto (opcional), centavos
// com vírgula e duas casas (opcionais) e sinal de menos.
const formatoDaNota = /^(-)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{2}))?$/;
// #endregion

// #region dinheiro-classe
export class Dinheiro implements ObjetoDeValor<Dinheiro> {
  readonly #centavos: bigint;

  private constructor(centavos: bigint) {
    this.#centavos = centavos;
  }

  static deCentavos(centavos: bigint): Dinheiro {
    return new Dinheiro(centavos);
  }

  // #region dinheiro-de-texto
  static deTexto(texto: string): Dinheiro {
    const partes = formatoDaNota.exec(texto.trim());
    if (partes === null) {
      throw new Error(`Dinheiro fora do formato da nota: '${texto}'`);
    }
    const [, sinal, reais = '', centavos = '00'] = partes;
    const valor =
      BigInt(reais.replaceAll('.', '')) * 100n + BigInt(centavos);
    return new Dinheiro(sinal === '-' ? -valor : valor);
  }
  // #endregion

  equivaleA(outro: Dinheiro): boolean {
    return this.#centavos === outro.#centavos;
  }

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
}
// #endregion

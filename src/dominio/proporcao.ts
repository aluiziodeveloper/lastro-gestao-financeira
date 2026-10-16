import type { ModoDeArredondamento } from './arredondamento.js';
import { inspecionar, type ObjetoDeValor } from './objeto-de-valor.js';
import { Dinheiro } from './dinheiro.js';
import { FracaoDeAcao } from './fracao-de-acao.js';
import { type ErroDeQuantidade, Quantidade } from './quantidade.js';
import { ok, type Result } from './resultado.js';

// #region proporcao-repartida
// As ações inteiras que ficam, o custo delas e a fração que sobra.
// Sem ações inteiras, a posição fica zerada e a fração leva o custo.
export interface Repartida {
  readonly quantidade: Quantidade | undefined;
  readonly custo: Dinheiro;
  readonly fracao: FracaoDeAcao | undefined;
}
// #endregion

// #region proporcao-politica
// A lei não fixa o arredondamento do custo das ações inteiras de um
// evento; o Lastro arredonda meio para cima, e a fração leva o resto,
// de modo que o custo total se conserva. Vai ao contador (X02).
const arredondamentoDasInteiras: ModoDeArredondamento =
  'meio-para-cima';
// #endregion

// #region proporcao-classe
// Quantas ações viram quantas: no desdobramento 1:2, cada ação vira
// duas; no grupamento 10:1, dez viram uma. A proporção responde às
// perguntas do evento e se aplica a uma quantidade.
export class Proporcao implements ObjetoDeValor<Proporcao> {
  readonly #de: Quantidade;
  readonly #para: Quantidade;

  private constructor(de: Quantidade, para: Quantidade) {
    this.#de = de;
    this.#para = para;
  }

  static entre(de: Quantidade, para: Quantidade): Proporcao {
    return new Proporcao(de, para);
  }

  aumenta(): boolean {
    return this.#para.paraBigInt() > this.#de.paraBigInt();
  }

  diminui(): boolean {
    return this.#para.paraBigInt() < this.#de.paraBigInt();
  }

  // #region proporcao-aplicada
  // As ações novas inteiras ficam com a parte proporcional do custo; a
  // fração de ação nova que sobra leva o restante. Os dois somam o
  // custo de antes.
  aplicadaA(
    quantidade: Quantidade,
    custo: Dinheiro,
  ): Result<Repartida, ErroDeQuantidade> {
    const de = this.#de.paraBigInt();
    const total = quantidade.paraBigInt() * this.#para.paraBigInt();
    const todas = Quantidade.criar(Number(total));
    if (!todas.ok) {
      return todas;
    }
    // Se quantidade × para não chega a de, não há nenhuma ação nova
    // inteira: a criação falha, e a posição fica zerada.
    const novas = Quantidade.criar(Number(total / de));
    const custoDasNovas = novas.ok
      ? custo
          .multiplicarPor(novas.valor)
          .multiplicarPor(this.#de)
          .dividirPor(todas.valor, arredondamentoDasInteiras)
      : Dinheiro.deCentavos(0n);
    const resto = total % de;
    const fracao =
      resto === 0n
        ? undefined
        : FracaoDeAcao.de(resto, de, custo.subtrair(custoDasNovas));
    const inteiras = novas.ok ? novas.valor : undefined;
    return ok({ quantidade: inteiras, custo: custoDasNovas, fracao });
  }
  // #endregion

  equivaleA(outra: Proporcao): boolean {
    return (
      this.#de.equivaleA(outra.#de) && this.#para.equivaleA(outra.#para)
    );
  }

  [inspecionar](): string {
    const de = String(this.#de.paraBigInt());
    const para = String(this.#para.paraBigInt());
    return `Proporcao(${de}:${para})`;
  }
}
// #endregion

import type { ModoDeArredondamento } from './arredondamento.js';
import type { Dinheiro } from './dinheiro.js';
import type { Compra, Venda } from './operacao.js';
import type { ErroDeQuantidade, Quantidade } from './quantidade.js';
import { err, ok, type Result } from './resultado.js';

// #region erro-de-posicao
export interface ErroDePosicao {
  readonly tipo: 'venda-acima-da-posicao';
  readonly emCarteira: Quantidade;
  readonly vendida: Quantidade;
}
// #endregion

// #region posicao-baixa
// A IN RFB 1.585/2015 não fixa o arredondamento da baixa; o Lastro
// arredonda o custo baixado e deixa a diferença no que resta.
const arredondamentoDaBaixa: ModoDeArredondamento = 'meio-para-cima';
// #endregion

// #region posicao-primeira-compra
// A posição de um ativo guarda o custo total e a quantidade; o preço
// médio é calculado a partir dos dois, quando alguém pergunta.
export class Posicao {
  readonly #quantidade: Quantidade;
  readonly #custoTotal: Dinheiro;

  private constructor(quantidade: Quantidade, custoTotal: Dinheiro) {
    this.#quantidade = quantidade;
    this.#custoTotal = custoTotal;
  }

  // #region posicao-custos-operacionais
  // Os custos da nota entram no custo de aquisição (IN RFB 1.585/2015,
  // art. 56, § 3º).
  static abrir(compra: Compra): Posicao {
    return new Posicao(
      compra.quantidade,
      compra.precoUnitario
        .multiplicarPor(compra.quantidade)
        .somar(compra.custos),
    );
  }

  // #region posicao-comprar
  comprar(compra: Compra): Result<Posicao, ErroDeQuantidade> {
    const quantidade = this.#quantidade.somar(compra.quantidade);
    if (!quantidade.ok) {
      return quantidade;
    }
    const custo = compra.precoUnitario
      .multiplicarPor(compra.quantidade)
      .somar(compra.custos);
    return ok(
      new Posicao(quantidade.valor, this.#custoTotal.somar(custo)),
    );
  }
  // #endregion
  // #endregion

  // #region posicao-vender
  // A venda baixa o custo na proporção da quantidade vendida; o custo
  // baixado e o que resta somam exatamente o custo anterior.
  vender(venda: Venda): Result<Posicao, ErroDePosicao> {
    const restante = this.#quantidade.subtrair(venda.quantidade);
    if (!restante.ok) {
      return err({
        tipo: 'venda-acima-da-posicao',
        emCarteira: this.#quantidade,
        vendida: venda.quantidade,
      });
    }
    const custoBaixado = this.#custoTotal
      .multiplicarPor(venda.quantidade)
      .dividirPor(this.#quantidade, arredondamentoDaBaixa);
    return ok(
      new Posicao(
        restante.valor,
        this.#custoTotal.subtrair(custoBaixado),
      ),
    );
  }
  // #endregion

  precoMedio(modo: ModoDeArredondamento): Dinheiro {
    return this.#custoTotal.dividirPor(this.#quantidade, modo);
  }
}
// #endregion

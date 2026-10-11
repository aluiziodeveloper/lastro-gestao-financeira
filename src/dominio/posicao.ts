import type { ModoDeArredondamento } from './arredondamento.js';
import { Dinheiro } from './dinheiro.js';
import {
  type Compra,
  custoDeAquisicao,
  type Venda,
} from './operacao.js';
import type { EventoAplicado } from './eventos.js';
import type { Proporcao } from './proporcao.js';
import type { ErroDeQuantidade, Quantidade } from './quantidade.js';
import { err, ok, type Result } from './resultado.js';

// #region erro-de-posicao
// Sem quantidade em carteira, `emCarteira` fica ausente.
export interface ErroDePosicao {
  readonly tipo: 'venda-acima-da-posicao';
  readonly emCarteira: Quantidade | undefined;
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
// médio é calculado a partir dos dois, quando alguém pergunta. Sem
// quantidade, a posição está zerada.
export class Posicao {
  readonly #quantidade: Quantidade | undefined;
  readonly #custoTotal: Dinheiro;

  private constructor(
    quantidade: Quantidade | undefined,
    custoTotal: Dinheiro,
  ) {
    this.#quantidade = quantidade;
    this.#custoTotal = custoTotal;
  }

  static zerada(): Posicao {
    return new Posicao(undefined, Dinheiro.deCentavos(0n));
  }

  static abrir(compra: Compra): Posicao {
    return new Posicao(compra.quantidade, custoDeAquisicao(compra));
  }

  // #region posicao-comprar
  comprar(compra: Compra): Result<Posicao, ErroDeQuantidade> {
    if (this.#quantidade === undefined) {
      return ok(Posicao.abrir(compra));
    }
    const quantidade = this.#quantidade.somar(compra.quantidade);
    if (!quantidade.ok) {
      return quantidade;
    }
    return ok(
      new Posicao(
        quantidade.valor,
        this.#custoTotal.somar(custoDeAquisicao(compra)),
      ),
    );
  }
  // #endregion

  // #region posicao-vender
  // A venda baixa o custo na proporção da quantidade vendida; o custo
  // baixado e o que resta somam exatamente o custo anterior.
  vender(venda: Venda): Result<Posicao, ErroDePosicao> {
    const emCarteira = this.#quantidade;
    // #region posicao-encerrar
    if (emCarteira?.equivaleA(venda.quantidade) === true) {
      return ok(Posicao.zerada());
    }
    // #endregion
    const restante = emCarteira?.subtrair(venda.quantidade);
    if (emCarteira === undefined || restante?.ok !== true) {
      return err({
        tipo: 'venda-acima-da-posicao',
        emCarteira,
        vendida: venda.quantidade,
      });
    }
    const custoBaixado = this.#custoTotal
      .multiplicarPor(venda.quantidade)
      .dividirPor(emCarteira, arredondamentoDaBaixa);
    return ok(
      new Posicao(
        restante.valor,
        this.#custoTotal.subtrair(custoBaixado),
      ),
    );
  }
  // #endregion

  // #region posicao-aplicar-fator
  // O evento troca a quantidade e reparte o custo: as ações inteiras
  // ficam com a parte delas, e a fração que sobra leva o resto.
  aplicarProporcao(
    proporcao: Proporcao,
  ): Result<EventoAplicado, ErroDeQuantidade> {
    if (this.#quantidade === undefined) {
      return ok({ posicao: this, fracao: undefined });
    }
    const repartida = proporcao.aplicadaA(
      this.#quantidade,
      this.#custoTotal,
    );
    if (!repartida.ok) {
      return repartida;
    }
    const { quantidade, custo, fracao } = repartida.valor;
    return ok({ posicao: new Posicao(quantidade, custo), fracao });
  }
  // #endregion

  // Consulta, como o preço médio: devolve um valor que não muda.
  custoTotal(): Dinheiro {
    return this.#custoTotal;
  }

  // #region posicao-quantidade
  // Consulta, como o preço médio: posição zerada tem quantidade zero.
  quantidade(): bigint {
    return this.#quantidade?.paraBigInt() ?? 0n;
  }
  // #endregion

  // #region posicao-preco-medio
  // Posição zerada não tem custo a dividir: o preço médio é zero.
  precoMedio(modo: ModoDeArredondamento): Dinheiro {
    if (this.#quantidade === undefined) {
      return Dinheiro.deCentavos(0n);
    }
    return this.#custoTotal.dividirPor(this.#quantidade, modo);
  }
  // #endregion
}
// #endregion

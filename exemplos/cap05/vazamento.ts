// Vazamento de encapsulamento (Capítulo 5): uma carteira que devolve o
// próprio Map. O Node 24 executa este arquivo removendo os tipos:
// node exemplos/cap05/vazamento.ts

// #region vazamento
class CarteiraQueVaza {
  readonly #quantidades = new Map<string, number>();

  registrarCompra(ticker: string, quantidade: number): void {
    const atual = this.#quantidades.get(ticker) ?? 0;
    this.#quantidades.set(ticker, atual + quantidade);
  }

  // A invariante está aqui: nunca vender mais do que se tem.
  registrarVenda(ticker: string, quantidade: number): void {
    const atual = this.#quantidades.get(ticker) ?? 0;
    if (quantidade > atual) {
      throw new Error(`venda a descoberto de ${ticker}`);
    }
    this.#quantidades.set(ticker, atual - quantidade);
  }

  // O getter devolve a referência ao Map, e não uma cópia.
  quantidades(): Map<string, number> {
    return this.#quantidades;
  }
}

const carteira = new CarteiraQueVaza();
carteira.registrarCompra('VALE3', 100);

// Quem recebeu o Map grava nele sem passar por registrarVenda.
const quantidades = carteira.quantidades();
quantidades.set('VALE3', -200);

console.log('VALE3 na carteira →', carteira.quantidades().get('VALE3'));
// #endregion

// ReadonlyMap não é imutável (Capítulo 5): o tipo tira o set do alcance
// do compilador, mas em execução o objeto continua um Map.
// node exemplos/cap05/readonly-map.ts

// #region readonly-map
class CarteiraSoParaLeitura {
  readonly #quantidades = new Map<string, number>([['VALE3', 100]]);

  quantidades(): ReadonlyMap<string, number> {
    return this.#quantidades;
  }
}

const carteira = new CarteiraSoParaLeitura();
const quantidades = carteira.quantidades();

// quantidades.set('VALE3', -200); // não compila: ReadonlyMap sem set
(quantidades as Map<string, number>).set('VALE3', -200);

console.log('VALE3 →', carteira.quantidades().get('VALE3'));
console.log('é um Map em execução →', quantidades instanceof Map);
// #endregion

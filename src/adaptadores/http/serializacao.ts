import type { Dinheiro } from '../../dominio/dinheiro.js';

// #region bigint-json
// JSON não tem bigint: JSON.stringify lança TypeError, e o Fastify
// responde 500. O valor sai como texto, em centavos, para quem calcula,
// e em reais, para quem lê.
export interface DinheiroEmJson {
  readonly centavos: string;
  readonly reais: string;
}

export function dinheiroEmJson(valor: Dinheiro): DinheiroEmJson {
  return {
    centavos: String(valor.emCentavos()),
    reais: valor.emReais(),
  };
}
// #endregion

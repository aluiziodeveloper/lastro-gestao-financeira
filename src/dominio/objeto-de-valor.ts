// #region objeto-de-valor
export interface ObjetoDeValor<T> {
  equivaleA(outro: T): boolean;
}
// #endregion

// #region inspecionar
// Campos com # não aparecem no console.log nem nas mensagens de falha
// dos testes. O Node e o Vitest chamam o método com esta chave, quando
// ele existe, para mostrar o objeto.
export const inspecionar: unique symbol = Symbol.for(
  'nodejs.util.inspect.custom',
);
// #endregion

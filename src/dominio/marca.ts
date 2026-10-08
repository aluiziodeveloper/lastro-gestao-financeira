// #region marca-tipo
// A marca só existe para o compilador: o símbolo é declarado, nunca
// criado, e em execução um valor marcado é o primitivo de sempre.
declare const marca: unique symbol;

export type Marcado<T, Nome extends string> = T & {
  readonly [marca]: Nome;
};
// #endregion

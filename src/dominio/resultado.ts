// #region resultado-tipo
// Sucesso ou erro como valor: quem recebe um Result precisa olhar
// o campo ok antes de usar o valor, e o compilador cobra isso.
export type Result<T, E> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly erro: E };

export function ok<T>(valor: T): Result<T, never> {
  return { ok: true, valor };
}

export function err<E>(erro: E): Result<never, E> {
  return { ok: false, erro };
}
// #endregion

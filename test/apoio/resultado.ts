import type { Result } from '../../src/dominio/resultado.js';

// #region extrair
// Só para testes: um erro inesperado deve derrubar o teste, e por isso
// aqui lançar é o comportamento certo. O domínio nunca usa este atalho.
export function extrair<T, E>(resultado: Result<T, E>): T {
  if (!resultado.ok) {
    throw new Error(
      `Result com erro inesperado: ${JSON.stringify(resultado.erro)}`,
    );
  }
  return resultado.valor;
}
// #endregion

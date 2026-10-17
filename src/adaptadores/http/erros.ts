import type { Resposta } from './resposta.js';

// #region erros-para-http
// O domínio devolve Result com um tipo de erro; a borda o traduz em
// status HTTP. A entrada malformada é 400; o pedido que repete ou
// atropela o histórico é 409; a regra de negócio recusada é 422.
const conflitos: ReadonlySet<string> = new Set([
  'operacao-repetida',
  'operacao-fora-de-ordem',
]);

export function statusDoErro(erro: { readonly tipo: string }): number {
  if (erro.tipo === 'entrada-invalida') {
    return 400;
  }
  return conflitos.has(erro.tipo) ? 409 : 422;
}

// Só o tipo vai no corpo: o erro pode trazer Dinheiro e Quantidade,
// que o JSON não sabe escrever.
export function respostaDoErro(erro: {
  readonly tipo: string;
}): Resposta {
  return { status: statusDoErro(erro), corpo: { tipo: erro.tipo } };
}
// #endregion

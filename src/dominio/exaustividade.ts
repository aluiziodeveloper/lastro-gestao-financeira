// #region garantir-exaustividade
// Só chega aqui um valor que o compilador considera impossível. Se um
// caso novo entrar numa união e algum switch não o tratar, o erro
// aparece na compilação, nesta chamada; a exceção protege só contra
// dados que burlaram os tipos.
export function garantirExaustividade(valor: never): never {
  throw new Error(`Caso não tratado: ${JSON.stringify(valor)}`);
}
// #endregion

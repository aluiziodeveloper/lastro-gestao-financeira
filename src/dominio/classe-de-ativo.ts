// #region classes-de-ativo
// A lista vem primeiro, e o tipo sai dela: quem precisa percorrer as
// classes usa a lista, e uma classe nova entra nos dois de uma vez.
export const classesDeAtivo = ['acao', 'fii', 'etf'] as const;

export type ClasseDeAtivo = (typeof classesDeAtivo)[number];
// #endregion

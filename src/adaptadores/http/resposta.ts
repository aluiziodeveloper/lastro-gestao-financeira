// #region resposta
// O que uma rota devolve: o status e o corpo. As funções que montam a
// resposta não tocam no Fastify, e o teste de cada uma é direto.
export interface Resposta {
  readonly status: number;
  readonly corpo: unknown;
}

export const entradaInvalida: Resposta = {
  status: 400,
  corpo: { tipo: 'entrada-invalida' },
};
// #endregion

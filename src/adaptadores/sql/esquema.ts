// #region esquema
// O histórico de cada carteira: uma linha por operação, numerada na
// ordem em que entrou. Dinheiro em centavos e quantidade em unidades,
// inteiros de 64 bits; a data como texto AAAA-MM-DD, sem fuso.
export const esquema = `
CREATE TABLE IF NOT EXISTS operacoes (
  carteira TEXT NOT NULL,
  sequencia INTEGER NOT NULL,
  id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'venda')),
  data TEXT NOT NULL,
  ticker TEXT NOT NULL,
  quantidade BIGINT NOT NULL,
  preco_centavos BIGINT NOT NULL,
  custos_centavos BIGINT NOT NULL,
  PRIMARY KEY (carteira, sequencia)
)`;
// #endregion

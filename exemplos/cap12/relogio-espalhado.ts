// #region relogio-espalhado
// O aplicativo da cena, fora do Lastro e resumido, em centavos. Cada
// função lê o relógio por conta própria: o mês corrente sai da data em
// UTC numa, e o início da janela, de Date.now() noutra.
export type RendaPorMes = Readonly<Record<string, bigint>>;

export function mesCorrente(): string {
  return new Date().toISOString().slice(0, 7);
}

export function inicioDaJanela(): Date {
  const umAno = 365 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - umAno);
}

// A renda do próximo mês, pelo número do mês: '11' é novembro.
export function rendaDoProximoMes(renda: RendaPorMes): bigint {
  const mes = Number(mesCorrente().slice(5, 7));
  const proximo = String((mes % 12) + 1).padStart(2, '0');
  return renda[proximo] ?? 0n;
}
// #endregion

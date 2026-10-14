import { describe, it } from 'vitest';

// #region especificacao-regras
describe('R6 · venda de cotas de FII · Capítulo 9', () => {
  it.todo(
    'tributa o ganho na venda de cotas de FII a 20%, sem isenção',
  );
});

describe('R7 · rendimentos de FII · Capítulo 10', () => {
  it.todo('isenta rendimentos de FII que cumprem os requisitos legais');
});

describe('R8 · dividendos · Capítulo 10', () => {
  it.todo(
    'retém 10% dos dividendos acima de R$ 50.000,00 por empresa no mês',
  );
});

describe('R9 · juros sobre capital próprio · Capítulo 10', () => {
  it.todo('retém 17,5% na fonte sobre juros sobre capital próprio');
});

describe('R10 · prejuízo acumulado · Capítulo 11', () => {
  it.todo('compensa prejuízo apenas no mesmo grupo de compensação');
});

describe('R11 · DARF · Capítulo 11', () => {
  it.todo('transfere ao mês seguinte o DARF abaixo do valor mínimo');
});

describe('R12 · enquadramento · Capítulo 13', () => {
  it.todo(
    'alerta quando uma classe de ativo sai da banda de tolerância',
  );
});
// #endregion

import { describe, it } from 'vitest';

// #region especificacao-regras
describe('R8 · dividendos · Capítulo 10', () => {
  it.todo(
    'retém 10% dos dividendos acima de R$ 50.000,00 por empresa no mês',
  );
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

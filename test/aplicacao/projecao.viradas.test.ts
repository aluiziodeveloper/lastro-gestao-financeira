import { describe, expect, it } from 'vitest';

import { projecaoAPartirDeHoje } from '../../src/aplicacao/projecao-a-partir-de-hoje.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import type { Provento } from '../../src/dominio/proventos/provento.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { relogioFixo } from '../apoio/relogio-fixo.js';
import { extrair } from '../apoio/resultado.js';
import {
  carteiraDaTabela,
  data,
} from '../dominio/carteira-de-renda.js';
import { mes } from '../dominio/referencias.js';

// O JCP de R$ 10,00 que o ITUB4 paga no dia 1 do mês que está para
// fechar: só entra na janela depois da meia-noite de São Paulo.
function jcpPagoEm(pagamento: string): Provento {
  return {
    tipo: 'jcp',
    ticker: extrair(Ticker.criar('ITUB4')),
    pagamento: data(pagamento),
    bruto: Dinheiro.deCentavos(10_00n),
    quantidade: extrair(Quantidade.criar(500)),
  };
}

// #region viradas
// Os testes fixam o instante, e não a data: cada linha é um instante
// UTC, com a hora de São Paulo no comentário, o primeiro mês projetado
// e se o provento do mês que acaba já entrou na janela.
describe('Projeção · viradas de mês e de ano (Tabela 12.3)', () => {
  // prettier-ignore
  it.each([
    // 31/10, 21h30 em São Paulo: a hora da cena
    ['2026-11-01T00:30:00Z', '2026-11', '2026-10-01', false],
    // 31/10, 23h59min59s
    ['2026-11-01T02:59:59Z', '2026-11', '2026-10-01', false],
    // 1º/11, 00h00: outubro fechou
    ['2026-11-01T03:00:00Z', '2026-12', '2026-10-01', true],
    // 31/12, 21h30: em UTC, já é 2027
    ['2027-01-01T00:30:00Z', '2027-01', '2026-12-01', false],
    // 1º/1/2027, 00h00: dezembro fechou
    ['2027-01-01T03:00:00Z', '2027-02', '2026-12-01', true],
  ])('%s: projeta de %s; o JCP de %s entra: %s',
    (instante, primeiro, pagamento, entra) => {
      const renda = projecaoAPartirDeHoje(
        relogioFixo(instante),
        [jcpPagoEm(pagamento)],
        carteiraDaTabela,
      );

      const esperado = entra ? 'R$ 10,00' : 'R$ 0,00';
      expect(renda.meses[0]?.mes).toEqual(mes(primeiro));
      expect(renda.total.emReais()).toBe(esperado);
    },
  );
});
// #endregion

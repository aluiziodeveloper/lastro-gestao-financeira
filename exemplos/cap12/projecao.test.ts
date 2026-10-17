import { describe, expect, it } from 'vitest';

import { projecaoAPartirDeHoje } from '../../src/aplicacao/projecao-a-partir-de-hoje.js';
import {
  dividendYield,
  emPercentual,
} from '../../src/dominio/projecao/dividend-yield.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { relogioFixo } from '../../test/apoio/relogio-fixo.js';
import { extrair } from '../../test/apoio/resultado.js';
import {
  carteiraDaTabela,
  cotacoesDaTabela,
  proventosDaTabela,
} from '../../test/dominio/carteira-de-renda.js';

// #region projecao-impressa
// O Lastro ainda não tem uma linha de comando: este exemplo projeta a
// renda da carteira da Tabela 12.1 à 00h30 UTC de 1º/11/2026, a hora
// da cena, e imprime o calendário e o yield no terminal.
function mesEAno(primeiroDia: string): string {
  return `${primeiroDia.slice(5, 7)}/${primeiroDia.slice(0, 4)}`;
}

describe('a projeção da cena', () => {
  it('imprime os doze meses e o yield da carteira', () => {
    const relogio = relogioFixo('2026-11-01T00:30:00Z');
    const renda = projecaoAPartirDeHoje(
      relogio,
      proventosDaTabela,
      carteiraDaTabela,
    );
    const meses = renda.meses.map(
      ({ mes, total }) =>
        `${mesEAno(mes.primeiroDia())}: ${total.emReais()}`,
    );
    const ativos = ['HGLG11', 'PETR4', 'ITUB4'].map((texto) =>
      extrair(Ticker.criar(texto)),
    );
    const yieldDaCarteira = extrair(
      dividendYield(renda, carteiraDaTabela, cotacoesDaTabela, ativos),
    );

    console.log(
      [
        ...meses,
        `Total: ${renda.total.emReais()}`,
        `Dividend yield: ${emPercentual(yieldDaCarteira)}`,
      ].join('\n'),
    );
    expect(meses[0]).toBe('11/2026: R$ 175,00');
  });
});
// #endregion

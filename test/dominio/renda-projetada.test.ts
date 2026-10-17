import { describe, expect, it } from 'vitest';

import { Dinheiro } from '../../src/dominio/dinheiro.js';
import {
  projetarRenda,
  type RendaProjetada,
} from '../../src/dominio/projecao/renda-projetada.js';
import type { Provento } from '../../src/dominio/proventos/provento.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import {
  carteiraCom,
  carteiraDaTabela,
  comprasDaTabela,
  data,
  proventosDaTabela,
} from './carteira-de-renda.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes } from './referencias.js';

function emReais(renda: RendaProjetada): Record<string, string> {
  return Object.fromEntries(
    renda.meses.map(({ mes, total }) => [
      mes.primeiroDia().slice(0, 7),
      total.emReais(),
    ]),
  );
}

function doAtivo(renda: RendaProjetada, texto: string): string {
  return renda.meses
    .flatMap(({ proventos }) => proventos)
    .filter(({ origem }) => origem.ticker.paraTexto() === texto)
    .reduce(
      (total, { valor }) => total.somar(valor),
      Dinheiro.deCentavos(0n),
    )
    .emReais();
}

// #region projecao-renda-teste
describe('Renda projetada · a carteira da Tabela 12.1', () => {
  const renda = projetarRenda(
    proventosDaTabela,
    carteiraDaTabela,
    mes('2026-10'),
  );

  it('projeta os doze meses depois do corrente, um a um', () => {
    expect(emReais(renda)).toEqual({
      '2026-11': 'R$ 175,00',
      '2026-12': 'R$ 475,00',
      '2027-01': 'R$ 175,00',
      '2027-02': 'R$ 175,00',
      '2027-03': 'R$ 475,00',
      '2027-04': 'R$ 175,00',
      '2027-05': 'R$ 175,00',
      '2027-06': 'R$ 475,00',
      '2027-07': 'R$ 175,00',
      '2027-08': 'R$ 175,00',
      '2027-09': 'R$ 475,00',
      '2027-10': 'R$ 175,00',
    });
    expect(renda.total.emReais()).toBe('R$ 3.300,00');
  });

  it('dá a cada ativo a renda da posição de hoje', () => {
    expect(doAtivo(renda, 'HGLG11')).toBe('R$ 1.980,00');
    expect(doAtivo(renda, 'PETR4')).toBe('R$ 1.200,00');
    expect(doAtivo(renda, 'ITUB4')).toBe('R$ 120,00');
  });

  it('repete o rendimento de 100 cotas como o de 150', () => {
    const [novembro] = renda.meses;
    const rendimento = novembro?.proventos.find(
      ({ origem }) => origem.tipo === 'rendimento-de-fii',
    );

    expect(rendimento?.origem.bruto.emReais()).toBe('R$ 110,00');
    expect(rendimento?.origem.pagamento).toBe('2025-11-14');
    expect(rendimento?.valor.emReais()).toBe('R$ 165,00');
  });
});
// #endregion

describe('Renda projetada · a janela', () => {
  it.each([
    ['2025-09-30', 0, 'um mês antes da janela'],
    ['2025-10-01', 1, 'o primeiro dia da janela'],
    ['2026-09-30', 1, 'o último dia da janela'],
    ['2026-10-01', 0, 'o mês corrente, que não fechou'],
  ])('um pagamento em %s entra %i vez (%s)', (pagamento, vezes) => {
    const renda = projetarRenda(
      [jcpDeItub4(pagamento, 500)],
      carteiraDaTabela,
      mes('2026-10'),
    );

    const projetados = renda.meses.flatMap(
      ({ proventos }) => proventos,
    );
    expect(projetados).toHaveLength(vezes);
  });

  it('põe o provento de outubro passado no outubro que vem', () => {
    const renda = projetarRenda(
      [jcpDeItub4('2025-10-01', 500)],
      carteiraDaTabela,
      mes('2026-10'),
    );

    const outubro = renda.meses.at(-1);
    expect(outubro?.mes).toEqual(mes('2027-10'));
    expect(outubro?.total.emReais()).toBe('R$ 10,00');
  });

  it('sem proventos na janela, projeta zero em todos os meses', () => {
    const renda = projetarRenda([], carteiraDaTabela, mes('2026-10'));

    expect(renda.meses).toHaveLength(12);
    expect(renda.total.emReais()).toBe('R$ 0,00');
  });
});

describe('Renda projetada · a posição de hoje', () => {
  it('quem vendeu tudo projeta zero', () => {
    const semItub4 = carteiraCom([
      ...comprasDaTabela,
      umaVenda({
        ticker: 'ITUB4',
        data: '2026-10-05',
        quantidade: 500,
        precoEmCentavos: 40_00n,
      }),
    ]);

    const renda = projetarRenda(
      proventosDaTabela,
      semItub4,
      mes('2026-10'),
    );

    expect(doAtivo(renda, 'ITUB4')).toBe('R$ 0,00');
    expect(renda.total.emReais()).toBe('R$ 3.180,00');
  });

  it.each([
    ['dividendo', dividendoDePetr4(200)],
    ['JCP', jcpDeItub4('2026-03-02', 250)],
  ])('escala o %s pelas ações de hoje', (_, provento) => {
    const renda = projetarRenda(
      [provento],
      carteiraDaTabela,
      mes('2026-10'),
    );

    expect(renda.total).toEqual(provento.bruto.somar(provento.bruto));
  });

  it('arredonda meio para cima: R$ 0,05 de 2 cotas, para 1 cota', () => {
    const umaCota = carteiraCom([
      umaCompra({
        ticker: 'HGLG11',
        data: '2025-08-01',
        quantidade: 1,
        precoEmCentavos: 160_00n,
      }),
    ]);
    const rendimento: Provento = {
      tipo: 'rendimento-de-fii',
      ticker: extrair(Ticker.criar('HGLG11')),
      pagamento: data('2026-05-14'),
      bruto: Dinheiro.deCentavos(5n),
      cotas: extrair(Quantidade.criar(2)),
    };

    const renda = projetarRenda([rendimento], umaCota, mes('2026-10'));

    expect(renda.total).toEqual(Dinheiro.deCentavos(3n));
  });
});

function jcpDeItub4(pagamento: string, acoes: number): Provento {
  return {
    tipo: 'jcp',
    ticker: extrair(Ticker.criar('ITUB4')),
    pagamento: data(pagamento),
    bruto: Dinheiro.deCentavos(BigInt(acoes) * 2n),
    quantidade: extrair(Quantidade.criar(acoes)),
  };
}

function dividendoDePetr4(acoes: number): Provento {
  return {
    tipo: 'dividendo',
    ticker: extrair(Ticker.criar('PETR4')),
    pagamento: data('2026-06-19'),
    bruto: Dinheiro.deCentavos(BigInt(acoes) * 75n),
    quantidade: extrair(Quantidade.criar(acoes)),
    anoDoLucro: 2025,
    aprovacao: data('2026-05-04'),
  };
}

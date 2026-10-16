import { describe, expect, it } from 'vitest';

import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import type {
  Dividendo,
  Jcp,
  Provento,
  RendimentoDeFii,
} from '../../src/dominio/proventos/provento.js';
import { tratarProvento } from '../../src/dominio/proventos/tratar-provento.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import type { SituacaoDoFundo } from '../../src/dominio/situacao-do-fundo.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { referenciasCom } from './referencias.js';

const referencias = referenciasCom(CatalogoDeAtivos.vazio());

function centavos(valor: bigint): Dinheiro {
  return Dinheiro.deCentavos(valor);
}

function umDividendo(pagamento: string, bruto: bigint): Dividendo {
  return {
    tipo: 'dividendo',
    ticker: extrair(Ticker.criar('VALE3')),
    pagamento: extrair(criarDataDoCalendario(pagamento)),
    bruto: centavos(bruto),
    anoDoLucro: 2025,
    aprovacao: extrair(criarDataDoCalendario('2025-12-01')),
  };
}

// #region provento-dividendo-teste
describe('Proventos · dividendo', () => {
  it.each([
    ['2025-12-15', 'pela Lei 9.249/1995, art. 10'],
    ['2026-03-16', 'abaixo do limite da Lei 15.270/2025'],
  ])('paga em %s, é isento (%s)', (pagamento) => {
    const dividendo = umDividendo(pagamento, 1_500_00n);

    expect(tratarProvento(dividendo, referencias)).toEqual(
      ok({
        provento: dividendo,
        tratamento: 'isento',
        retido: centavos(0n),
        liquido: centavos(1_500_00n),
      }),
    );
  });

  it('pago antes de 2024, não tem lei conhecida', () => {
    const dividendo = umDividendo('2023-12-15', 1_500_00n);

    expect(tratarProvento(dividendo, referencias)).toEqual(
      err({ tipo: 'sem-regime-vigente', data: '2023-12-15' }),
    );
  });
});
// #endregion

function umJcp(pagamento: string, bruto: bigint): Jcp {
  const { ticker } = umDividendo(pagamento, bruto);
  return {
    tipo: 'jcp',
    ticker,
    pagamento: extrair(criarDataDoCalendario(pagamento)),
    bruto: centavos(bruto),
  };
}

// #region jcp-teste
describe('R9 · juros sobre capital próprio, retidos na fonte', () => {
  it.each([
    ['2025-12-30', '15%', 185_18n],
    ['2026-01-02', '17,5%', 216_05n],
  ])('R$ 1.234,56 pagos em %s: %s', (pagamento, _aliquota, retido) => {
    const jcp = umJcp(pagamento, 1_234_56n);

    expect(tratarProvento(jcp, referencias)).toEqual(
      ok({
        provento: jcp,
        tratamento: 'exclusivo-na-fonte',
        retido: centavos(retido),
        liquido: centavos(1_234_56n - retido),
      }),
    );
  });

  it('a alíquota é a da data do pagamento ou do crédito', () => {
    const retidoEm = (pagamento: string) =>
      extrair(
        tratarProvento(umJcp(pagamento, 100_000_00n), referencias),
      ).retido;

    expect([retidoEm('2025-12-31'), retidoEm('2026-01-01')]).toEqual([
      centavos(15_000_00n),
      centavos(17_500_00n),
    ]);
  });
});
// #endregion

const hglg11 = extrair(Ticker.criar('HGLG11'));

function fundo(campos: Partial<SituacaoDoFundo> = {}): SituacaoDoFundo {
  return {
    desde: extrair(criarDataDoCalendario('2024-01-01')),
    negociacao: 'bolsa-ou-balcao-organizado',
    cotistas: 100,
    cotasEmitidas: extrair(Quantidade.criar(1_000)),
    ...campos,
  };
}

function referenciasDoFundo(situacao: SituacaoDoFundo) {
  const catalogo = CatalogoDeAtivos.vazio().com(hglg11, 'fii');
  return referenciasCom(
    extrair(catalogo.comSituacaoDoFundo(hglg11, situacao)),
  );
}

function umRendimento(cotas: number): RendimentoDeFii {
  return {
    tipo: 'rendimento-de-fii',
    ticker: hglg11,
    pagamento: extrair(criarDataDoCalendario('2026-03-13')),
    bruto: centavos(850_00n),
    cotas: extrair(Quantidade.criar(cotas)),
  };
}

function tratamentoDe(cotas: number, situacao: SituacaoDoFundo) {
  return extrair(
    tratarProvento(umRendimento(cotas), referenciasDoFundo(situacao)),
  );
}

// #region fii-teste
describe('R7 · rendimentos de FII · isenção com requisitos', () => {
  it('isenta com 100 cotistas e 99 das 1.000 cotas, em bolsa', () => {
    expect(tratamentoDe(99, fundo())).toMatchObject({
      tratamento: 'isento',
      retido: centavos(0n),
    });
  });

  it.each([
    ['com 99 cotistas', 99, fundo({ cotistas: 99 })],
    ['com 100 das 1.000 cotas, 10%', 100, fundo()],
    ['fora de bolsa', 99, fundo({ negociacao: 'outra' })],
  ])(
    'retém 20%%: R$ 850,00 dão R$ 170,00 %s',
    (_caso, cotas, situacao) => {
      expect(tratamentoDe(cotas, situacao)).toMatchObject({
        tratamento: 'exclusivo-na-fonte',
        retido: centavos(170_00n),
        liquido: centavos(680_00n),
      });
    },
  );

  it('não trata sem conhecer a situação do fundo na data', () => {
    const deAbril = fundo({
      desde: extrair(criarDataDoCalendario('2026-04-01')),
    });

    expect(
      tratarProvento(umRendimento(10), referenciasDoFundo(deAbril)),
    ).toEqual(
      err({
        tipo: 'situacao-do-fundo-desconhecida',
        ticker: hglg11,
        data: '2026-03-13',
      }),
    );
  });
});
// #endregion

describe('Proventos · dados que burlaram os tipos', () => {
  it('lança com um tipo de provento que a união não tem', () => {
    const intruso = {
      ...umDividendo('2026-03-16', 1_00n),
      tipo: 'bonificacao',
    } as unknown as Provento;

    expect(() => tratarProvento(intruso, referencias)).toThrow(
      'Caso não tratado: {"tipo":"bonificacao"',
    );
  });
});

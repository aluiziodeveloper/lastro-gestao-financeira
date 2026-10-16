import { describe, expect, it } from 'vitest';

import type { MovimentoDoMes } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { apurarMeses } from '../../src/dominio/apuracao/apuracao-dos-meses.js';
import { apurarMes } from '../../src/dominio/apuracao/apuracao-mensal.js';
import { estadoInicial } from '../../src/dominio/apuracao/estado-da-apuracao.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import {
  deduzirIrrf,
  type ImpostoRetido,
  retidoNoMes,
  type TipoDeRetencao,
} from '../../src/dominio/irrf/imposto-retido.js';
import { err, ok } from '../../src/dominio/resultado.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes, referenciasCom } from './referencias.js';

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

function retencao(
  data: string,
  centavos: bigint,
  tipo: TipoDeRetencao = 'vendas',
): ImpostoRetido {
  return {
    tipo,
    data: extrair(criarDataDoCalendario(data)),
    valor: reais(centavos),
  };
}

// #region irrf-deducao-teste
describe('IRRF: dedução do imposto do mês', () => {
  it('o retido abate o imposto, e nada sobra', () => {
    expect(
      deduzirIrrf(
        mes('2026-04'),
        reais(450_00n),
        reais(0n),
        reais(1_25n),
      ),
    ).toEqual({
      retido: reais(1_25n),
      deduzido: reais(1_25n),
      saldo: reais(0n),
      encerrado: reais(0n),
    });
  });

  it('sem imposto no mês, o retido fica para os seguintes', () => {
    const semImposto = deduzirIrrf(
      mes('2026-04'),
      reais(0n),
      reais(0n),
      reais(1_25n),
    );

    expect(semImposto.deduzido).toEqual(reais(0n));
    expect(semImposto.saldo).toEqual(reais(1_25n));
  });

  it('o saldo e o retido abatem até o valor do imposto', () => {
    const parcial = deduzirIrrf(
      mes('2026-05'),
      reais(3_00n),
      reais(2_00n),
      reais(1_50n),
    );

    expect(parcial.deduzido).toEqual(reais(3_00n));
    expect(parcial.saldo).toEqual(reais(50n));
  });

  it('em dezembro, o que sobra se encerra (pergunta 715)', () => {
    expect(
      deduzirIrrf(
        mes('2026-12'),
        reais(1_00n),
        reais(2_00n),
        reais(0n),
      ),
    ).toEqual({
      retido: reais(0n),
      deduzido: reais(1_00n),
      saldo: reais(0n),
      encerrado: reais(1_00n),
    });
  });
});
// #endregion

describe('IRRF: o retido nas notas do mês', () => {
  it('soma as retenções das notas do mês', () => {
    expect(
      retidoNoMes(mes('2026-06'), [
        retencao('2026-06-10', 1_25n),
        retencao('2026-06-16', 10_00n, 'day-trade'),
      ]),
    ).toEqual(ok(reais(11_25n)));
  });

  it('sem notas, o retido é zero', () => {
    expect(retidoNoMes(mes('2026-06'), [])).toEqual(ok(reais(0n)));
  });

  it('recusa uma retenção de outro mês', () => {
    expect(
      retidoNoMes(mes('2026-06'), [retencao('2026-07-01', 1_25n)]),
    ).toEqual(
      err({ tipo: 'retencao-fora-do-mes', data: '2026-07-01' }),
    );
  });

  it('recusa uma retenção negativa', () => {
    expect(
      retidoNoMes(mes('2026-06'), [retencao('2026-06-10', -1n)]),
    ).toEqual(err({ tipo: 'retencao-negativa', data: '2026-06-10' }));
  });
});

const referencias = referenciasCom(
  CatalogoDeAtivos.vazio().com(extrair(Ticker.criar('PETR4')), 'acao'),
);
const inicial = estadoInicial(
  Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))),
);

describe('IRRF na apuração', () => {
  // Junho de 2026: R$ 1.000,00 de lucro em day trade, 20% de imposto,
  // e a corretora reteve 1% do resultado, R$ 10,00.
  const junho: MovimentoDoMes = {
    mes: mes('2026-06'),
    operacoes: [
      umaCompra({
        data: '2026-06-16',
        quantidade: 1_000,
        precoEmCentavos: 10_00n,
      }),
      umaVenda({
        data: '2026-06-16',
        quantidade: 1_000,
        precoEmCentavos: 11_00n,
      }),
    ],
    retencoes: [retencao('2026-06-16', 10_00n, 'day-trade')],
  };

  it('deduz os R$ 10,00 retidos dos R$ 200,00 do day trade', () => {
    const { irrf } = extrair(apurarMes(inicial, junho, referencias));

    expect(irrf.deduzido).toEqual(reais(10_00n));
    expect(irrf.saldo).toEqual(reais(0n));
  });

  it('recusa o mês com retenção de outro mês', () => {
    const comErro = {
      ...junho,
      retencoes: [retencao('2026-05-29', 1_25n)],
    };

    expect(apurarMes(inicial, comErro, referencias)).toEqual(
      err({ tipo: 'retencao-fora-do-mes', data: '2026-05-29' }),
    );
  });

  // Novembro: R$ 25.000,00 vendidos com prejuízo; a corretora retém
  // 0,005%, R$ 1,25, e não há imposto para abater.
  const novembro: MovimentoDoMes = {
    mes: mes('2026-11'),
    operacoes: [
      umaCompra({
        data: '2026-11-03',
        quantidade: 1_000,
        precoEmCentavos: 26_00n,
      }),
      umaVenda({
        data: '2026-11-20',
        quantidade: 1_000,
        precoEmCentavos: 25_00n,
      }),
    ],
    retencoes: [retencao('2026-11-20', 1_25n)],
  };
  const dezembro = {
    mes: mes('2026-12'),
    operacoes: [],
    retencoes: [],
  };

  it('o saldo de novembro passa a dezembro e lá se encerra', () => {
    const fimDeAno = extrair(
      apurarMeses([novembro, dezembro], inicial, referencias),
    );
    const [depoisDeNovembro, depoisDeDezembro] = fimDeAno.apuracoes;

    expect(depoisDeNovembro?.estado.irrf).toEqual(reais(1_25n));
    expect(depoisDeDezembro?.irrf.encerrado).toEqual(reais(1_25n));
    expect(fimDeAno.estado.irrf).toEqual(reais(0n));
  });
});

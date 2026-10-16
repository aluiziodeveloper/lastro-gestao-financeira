import { describe, expect, it } from 'vitest';

import { Aliquota } from '../../src/dominio/aliquota.js';
import { apurarMes } from '../../src/dominio/apuracao/apuracao-mensal.js';
import { calendarioNacional } from '../../src/dominio/calendario.js';
import { estadoInicial } from '../../src/dominio/apuracao/estado-da-apuracao.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarEmissor } from '../../src/dominio/emissor.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import { retencaoDeDividendos } from '../../src/dominio/proventos/dividendos.js';
import type { Provento } from '../../src/dominio/proventos/provento.js';
import { tratarProvento } from '../../src/dominio/proventos/tratar-provento.js';
import type { DefinicaoDeRegime } from '../../src/dominio/regime/regime-tributario.js';
import { definicoesDoLastro } from '../../src/dominio/regime/regimes.js';
import { RegimesTributarios } from '../../src/dominio/regime/regimes-tributarios.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from './construtores.js';
import { mes, regimesDoLastro } from './referencias.js';

const [petr4, vale3] = ['PETR4', 'VALE3'].map((codigo) =>
  extrair(Ticker.criar(codigo)),
) as [Ticker, Ticker];

const catalogo = extrair(
  CatalogoDeAtivos.vazio()
    .com(petr4, 'acao')
    .com(vale3, 'acao')
    .comEmissor(vale3, extrair(criarEmissor('vale'))),
);

function data(texto: string) {
  return extrair(criarDataDoCalendario(texto));
}

function centavos(valor: bigint): Dinheiro {
  return Dinheiro.deCentavos(valor);
}

// A cena do Capítulo 9 num ano qualquer: compra em fevereiro e venda
// em março, com R$ 20.000,01 vendidos e R$ 1.200,00 de lucro.
function cenaEm(ano: string) {
  const compra = (
    ticker: string,
    quantidade: number,
    preco: bigint,
    custos: bigint,
  ) =>
    umaCompra({
      ticker,
      data: `${ano}-02-10`,
      quantidade,
      precoEmCentavos: preco,
      custosEmCentavos: custos,
    });
  const venda = (
    ticker: string,
    quantidade: number,
    preco: bigint,
    custos: bigint,
  ) =>
    umaVenda({
      ticker,
      data: `${ano}-03-16`,
      quantidade,
      precoEmCentavos: preco,
      custosEmCentavos: custos,
    });
  return {
    antes: [
      compra('PETR4', 100, 32_93n, 3_00n),
      compra('VALE3', 267, 58_03n, 4_00n),
    ],
    doMes: [
      venda('PETR4', 100, 37_05n, 1_11n),
      venda('VALE3', 267, 61_03n, 4_89n),
    ],
  };
}

function carteiraCom(operacoes: readonly Operacao[]): Carteira {
  return operacoes.reduce(
    (carteira, operacao) => extrair(carteira.registrar(operacao)),
    Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))),
  );
}

function impostoDaCena(ano: string, regimes: RegimesTributarios) {
  const { antes, doMes } = cenaEm(ano);
  const apuracao = extrair(
    apurarMes(
      estadoInicial(carteiraCom(antes)),
      { mes: mes(`${ano}-03`), operacoes: doMes, retencoes: [] },
      {
        catalogo,
        regimes,
        calendario: calendarioNacional,
      },
    ),
  );
  const [acoes] = apuracao.categorias;
  return acoes?.imposto;
}

// #region regime-datas
describe('Antes e depois das viradas de 2024 e de 2026', () => {
  const referencias = {
    catalogo,
    regimes: regimesDoLastro,
    calendario: calendarioNacional,
  };

  it('dezembro de 2023 não tem regime; janeiro de 2024 tem', () => {
    const apurar = (texto: string) =>
      apurarMes(
        estadoInicial(carteiraCom([])),
        { mes: mes(texto), operacoes: [], retencoes: [] },
        referencias,
      ).ok;

    expect([apurar('2023-12'), apurar('2024-01')]).toEqual([
      false,
      true,
    ]);
  });

  it('JCP: 15% em 31/12/2025 e 17,5% em 1º/1/2026', () => {
    const retido = (pagamento: string) =>
      extrair(
        tratarProvento(
          {
            tipo: 'jcp',
            ticker: vale3,
            pagamento: data(pagamento),
            bruto: centavos(1_000_00n),
          },
          referencias,
        ),
      ).retido;

    expect([retido('2025-12-31'), retido('2026-01-01')]).toEqual([
      centavos(150_00n),
      centavos(175_00n),
    ]);
  });

  it('R$ 90 mil de dividendos: retém só desde jan/2026', () => {
    const retido = (texto: string) => {
      const dividendo: Provento = {
        tipo: 'dividendo',
        ticker: vale3,
        pagamento: data(`${texto}-15`),
        bruto: centavos(90_000_00n),
        anoDoLucro: 2026,
        aprovacao: data(`${texto}-01`),
      };
      return extrair(
        retencaoDeDividendos(mes(texto), [dividendo], referencias),
      ).map(({ retido: valor }) => valor);
    };

    expect([retido('2025-12'), retido('2026-01')]).toEqual([
      [],
      [centavos(9_000_00n)],
    ]);
  });
});
// #endregion

// O regime que a MP 1.303/2025 teria criado em 2026, só com a alíquota
// de 17,5% para ações: a apuração trimestral e a isenção trimestral
// mudariam a forma da regra, e não cabem num regime de dados.
function comAMp(): RegimesTributarios {
  const [antigo, atual] = definicoesDoLastro as [
    DefinicaoDeRegime,
    DefinicaoDeRegime,
  ];
  const acoes = atual.apuracao['acoes-comum'];
  const daMp: DefinicaoDeRegime = {
    ...atual,
    nome: 'mp-1303',
    apuracao: {
      ...atual.apuracao,
      'acoes-comum': { ...acoes, aliquota: Aliquota.de(175n, 1000n) },
    },
  };
  return extrair(RegimesTributarios.criar([antigo, daMp]));
}

// #region regime-hipotetico
describe('O regime que nunca vigorou: a MP 1.303/2025', () => {
  it('não muda o passado: março de 2025 continua a 15%', () => {
    expect(impostoDaCena('2025', comAMp())).toEqual(centavos(180_00n));
  });

  it('com ele, março de 2026 iria a 17,5%: R$ 210,00', () => {
    expect(impostoDaCena('2026', comAMp())).toEqual(centavos(210_00n));
  });

  it('sem ele, março de 2026 volta a R$ 180,00', () => {
    expect(impostoDaCena('2026', regimesDoLastro)).toEqual(
      centavos(180_00n),
    );
  });
});
// #endregion

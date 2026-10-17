import { describe, expect, it } from 'vitest';

import {
  type Composicao,
  composicaoDe,
} from '../../src/dominio/alocacao/composicao.js';
import { desenquadramentos } from '../../src/dominio/alocacao/desenquadramento.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { pontosBase } from '../../src/dominio/mercado/pontos-base.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';
import { carteiraCom } from './carteira-de-renda.js';
import {
  alocacaoDaCena,
  carteiraDaCena,
  catalogoDaCena,
  cotacoesDaCena,
  ticker,
} from './carteira-desenquadrada.js';

function reais(centavos: bigint): Dinheiro {
  return Dinheiro.deCentavos(centavos);
}

// Ações e FII somam o total; ETF fica em zero.
function composicao(acoes: bigint, fii: bigint): Composicao {
  return {
    total: reais(acoes + fii),
    porClasse: { acao: reais(acoes), fii: reais(fii), etf: reais(0n) },
  };
}

describe('Composição da carteira', () => {
  it('soma o valor de cada classe pelas cotações e pelo catálogo', () => {
    expect(
      extrair(
        composicaoDe(carteiraDaCena, cotacoesDaCena, catalogoDaCena),
      ),
    ).toEqual(composicao(132_000_00n, 80_000_00n));
  });

  it('sem a cotação de um ativo, não compõe', () => {
    expect(
      composicaoDe(
        carteiraDaCena,
        cotacoesDaCena.slice(1),
        catalogoDaCena,
      ),
    ).toEqual(err({ tipo: 'sem-cotacao', ticker: ticker('PETR4') }));
  });

  it('com um ativo fora do catálogo, não compõe', () => {
    expect(
      composicaoDe(
        carteiraDaCena,
        cotacoesDaCena,
        CatalogoDeAtivos.vazio(),
      ),
    ).toEqual(
      err({ tipo: 'ativo-fora-do-catalogo', ticker: ticker('PETR4') }),
    );
  });
});

// #region alerta-teste
describe('Desenquadramento', () => {
  it('a cena: ações acima da banda, FII abaixo', () => {
    expect(
      desenquadramentos(
        composicao(132_000_00n, 80_000_00n),
        alocacaoDaCena,
      ),
    ).toEqual([
      {
        classe: 'acao',
        direcao: 'acima',
        peso: pontosBase(6_226n),
        alvo: pontosBase(5_000n),
        banda: pontosBase(500n),
      },
      {
        classe: 'fii',
        direcao: 'abaixo',
        peso: pontosBase(3_774n),
        alvo: pontosBase(5_000n),
        banda: pontosBase(500n),
      },
    ]);
  });

  // prettier-ignore
  it.each([
    ['55% exatos', 55_000_00n, 45_000_00n, ''],
    ['acima de 55%', 55_000_01n, 44_999_99n, 'acao acima, fii abaixo'],
    ['45% exatos', 45_000_00n, 55_000_00n, ''],
    ['abaixo de 45%', 44_999_99n, 55_000_01n, 'acao abaixo, fii acima'],
  ])('ações com %s de R$ 100.000,00', (_, acoes, fii, esperado) => {
    const daVez = composicao(acoes, fii);

    const alertas = desenquadramentos(daVez, alocacaoDaCena).map(
      ({ classe, direcao }) => `${classe} ${direcao}`,
    );

    expect(alertas.join(', ')).toBe(esperado);
  });

  it('uma classe sem alvo, com algum valor, está acima', () => {
    const comEtf: Composicao = {
      total: reais(100_00n),
      porClasse: {
        acao: reais(50_00n),
        fii: reais(49_00n),
        etf: reais(1_00n),
      },
    };

    expect(desenquadramentos(comEtf, alocacaoDaCena)).toEqual([
      expect.objectContaining({ classe: 'etf', direcao: 'acima' }),
    ]);
  });

  it('a carteira vazia não tem alerta', () => {
    const vazia = extrair(
      composicaoDe(carteiraCom([]), cotacoesDaCena, catalogoDaCena),
    );

    expect(desenquadramentos(vazia, alocacaoDaCena)).toEqual([]);
  });
});
// #endregion

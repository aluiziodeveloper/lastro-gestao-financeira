import { describe, expect, it } from 'vitest';

import type { MovimentoDoMes } from '../../src/dominio/apuracao/apuracao-do-mes.js';
import { apurarMeses } from '../../src/dominio/apuracao/apuracao-dos-meses.js';
import { estadoInicial } from '../../src/dominio/apuracao/estado-da-apuracao.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { calendarioNacional } from '../../src/dominio/calendario.js';
import { Carteira } from '../../src/dominio/carteira.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { definicoesDoLastro } from '../../src/dominio/regime/regimes.js';
import { RegimesTributarios } from '../../src/dominio/regime/regimes-tributarios.js';
import { relatorioDoMes } from '../../src/dominio/relatorio/relatorio.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../../test/apoio/resultado.js';
import {
  umaCompra,
  umaVenda,
} from '../../test/dominio/construtores.js';
import { mes } from '../../test/dominio/referencias.js';

// #region relatorio-impresso
// O Lastro ainda não tem uma linha de comando: este exemplo apura os
// meses da cena e imprime no terminal o relatório de abril.
const referencias = {
  catalogo: CatalogoDeAtivos.vazio()
    .com(extrair(Ticker.criar('PETR4')), 'acao')
    .com(extrair(Ticker.criar('HGLG11')), 'fii'),
  regimes: extrair(RegimesTributarios.criar(definicoesDoLastro)),
  calendario: calendarioNacional,
};

const abril: MovimentoDoMes = {
  mes: mes('2026-04'),
  operacoes: [
    umaCompra({
      ticker: 'PETR4',
      data: '2026-04-02',
      quantidade: 1_000,
      precoEmCentavos: 22_00n,
    }),
    umaCompra({
      ticker: 'HGLG11',
      data: '2026-04-02',
      quantidade: 100,
      precoEmCentavos: 160_00n,
    }),
    umaVenda({
      ticker: 'PETR4',
      data: '2026-04-15',
      quantidade: 1_000,
      precoEmCentavos: 25_00n,
    }),
    umaVenda({
      ticker: 'HGLG11',
      data: '2026-04-15',
      quantidade: 100,
      precoEmCentavos: 130_00n,
    }),
  ],
  retencoes: [],
};

describe('o relatório da cena', () => {
  it('imprime o relatório de abril de 2026', () => {
    const inicial = estadoInicial(
      Carteira.abrir(extrair(criarIdDeCarteira('carteira-1'))),
    );
    const [apuracao] = extrair(
      apurarMeses([abril], inicial, referencias),
    ).apuracoes;
    const linhas =
      apuracao === undefined ? [] : relatorioDoMes(apuracao);

    console.log(linhas.join('\n'));
    expect(linhas.at(-1)).toBe(
      'DARF 6015: R$ 450,00, vencimento 29/05/2026',
    );
  });
});
// #endregion

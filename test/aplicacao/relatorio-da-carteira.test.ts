import { describe, expect, it } from 'vitest';

import { registrarOperacoes } from '../../src/aplicacao/registrar-operacoes.js';
import { relatorioDoMesDaCarteira } from '../../src/aplicacao/relatorio-da-carteira.js';
import { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { repositorioDeTeste } from '../apoio/repositorio-de-teste.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from '../dominio/construtores.js';
import { mes, referenciasCom } from '../dominio/referencias.js';

const id = extrair(criarIdDeCarteira('carteira-1'));
const referencias = referenciasCom(
  CatalogoDeAtivos.vazio()
    .com(extrair(Ticker.criar('PETR4')), 'acao')
    .com(extrair(Ticker.criar('HGLG11')), 'fii'),
);

// A cena de abril de 2026 do Capítulo 11, com a compra de PETR4 em
// fevereiro, para que março, vazio, fique no meio da apuração.
const operacoes = [
  umaCompra({
    id: 'op-1',
    data: '2026-02-02',
    quantidade: 1_000,
    precoEmCentavos: 22_00n,
  }),
  umaCompra({
    id: 'op-2',
    ticker: 'HGLG11',
    data: '2026-04-02',
    quantidade: 100,
    precoEmCentavos: 160_00n,
  }),
  umaVenda({
    id: 'op-3',
    data: '2026-04-15',
    quantidade: 1_000,
    precoEmCentavos: 25_00n,
  }),
  umaVenda({
    id: 'op-4',
    ticker: 'HGLG11',
    data: '2026-04-15',
    quantidade: 100,
    precoEmCentavos: 130_00n,
  }),
];

// #region caso-de-uso-relatorio-teste
describe('Relatório do mês da carteira', () => {
  it('apura de fevereiro a abril e devolve abril', async () => {
    const repositorio = repositorioDeTeste();
    await registrarOperacoes(repositorio, id, operacoes);

    const linhas = extrair(
      await relatorioDoMesDaCarteira(
        repositorio,
        referencias,
        id,
        mes('2026-04'),
      ),
    );

    expect(linhas[0]).toBe('Apuração de 04/2026');
    expect(linhas.at(-1)).toBe(
      'DARF 6015: R$ 450,00, vencimento 29/05/2026',
    );
  });

  it('num mês antes das operações, devolve o mês vazio', async () => {
    const repositorio = repositorioDeTeste();
    await registrarOperacoes(repositorio, id, operacoes);

    const linhas = extrair(
      await relatorioDoMesDaCarteira(
        repositorio,
        referencias,
        id,
        mes('2026-01'),
      ),
    );

    expect(linhas[0]).toBe('Apuração de 01/2026');
    expect(linhas.at(-1)).toBe('Nada a recolher');
  });
});
// #endregion

import { describe, expect, it } from 'vitest';

// #region api-publica
// O contrato público, nome a nome. Uma exportação que some ou muda de
// nome quebra quem usa o pacote; este teste fica vermelho antes que a
// mudança chegue a uma versão. Os tipos não aparecem aqui: o
// compilador os apaga, e quem os confere é o tsc de quem importa.
const dominio = [
  'Carteira',
  'CatalogoDeAtivos',
  'Dinheiro',
  'MesDeApuracao',
  'Quantidade',
  'RegimesTributarios',
  'Ticker',
  'calendarioNacional',
  'classesDeAtivo',
  'criarCompra',
  'criarDataDePregao',
  'criarIdDeCarteira',
  'criarIdDeOperacao',
  'criarVenda',
  'definicoesDoLastro',
  'err',
  'ok',
  'posicaoDaCarteira',
  'projecaoAPartirDeHoje',
  'registrarOperacoes',
  'relatorioDoMesDaCarteira',
];

const adaptadores = [
  'cabecalho',
  'criarApp',
  'importarCsv',
  'relogioDoSistema',
  'repositorioEmMemoria',
  'repositorioPostgres',
  'repositorioSqlite',
];

describe('API pública do pacote', () => {
  it('o ponto de entrada principal exporta o domínio', async () => {
    const pacote = await import('../../src/index.js');

    expect(Object.keys(pacote).sort()).toEqual(dominio);
  });

  it('os adaptadores ficam num ponto de entrada à parte', async () => {
    const pacote = await import('../../src/adaptadores/index.js');

    expect(Object.keys(pacote).sort()).toEqual(adaptadores);
  });
});
// #endregion

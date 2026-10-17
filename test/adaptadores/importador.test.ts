import { describe, expect, it } from 'vitest';

import { importarCsv } from '../../src/adaptadores/csv/importador.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra, umaVenda } from '../dominio/construtores.js';

const cabecalho = 'Data;C/V;Ativo;Quantidade;Preço;Custos';

function csv(...linhas: string[]): string {
  return [cabecalho, ...linhas].join('\n');
}

// #region importador-csv-teste
describe('Importador de CSV', () => {
  it('traduz as linhas e as põe na ordem das datas', () => {
    const texto = csv(
      '15/04/2026;V;PETR4;1000;25,00;7,45',
      '02/02/2026;C;PETR4;1.000;22,00;0,00',
    );

    expect(extrair(importarCsv(texto, 'extrato.csv'))).toEqual([
      umaCompra({
        id: 'extrato.csv:3',
        data: '2026-02-02',
        quantidade: 1_000,
        precoEmCentavos: 22_00n,
      }),
      umaVenda({
        id: 'extrato.csv:2',
        data: '2026-04-15',
        quantidade: 1_000,
        precoEmCentavos: 25_00n,
        custosEmCentavos: 7_45n,
      }),
    ]);
  });

  it('mantém a ordem do arquivo dentro do mesmo dia', () => {
    const texto = csv(
      '02/04/2026;C;HGLG11;100;160,00;0,00',
      '02/04/2026;C;PETR4;1000;22,00;0,00',
    );

    const ids = extrair(importarCsv(texto, 'x')).map(({ id }) => id);

    expect(ids).toEqual(['x:2', 'x:3']);
  });

  it('ignora linhas em branco e aceita CRLF', () => {
    const linha = '02/04/2026;C;PETR4;100;1.234,56;0,00';
    const texto = [cabecalho, '', linha, ''].join('\r\n');

    const [operacao] = extrair(importarCsv(texto, 'x'));

    expect(operacao?.precoUnitario.emCentavos()).toBe(1_234_56n);
  });

  it('recusa o arquivo sem o cabeçalho esperado', () => {
    expect(importarCsv('Data,Ativo', 'x')).toEqual(
      err({ tipo: 'linha-invalida', linha: 1, campo: 'cabeçalho' }),
    );
  });

  it.each([
    ['31/02/2026;C;PETR4;100;22,00;0,00', 'data'],
    ['02/04/2026;X;PETR4;100;22,00;0,00', 'C/V'],
    ['02/04/2026;C;petr4!;100;22,00;0,00', 'ticker'],
    ['02/04/2026;C;PETR4;0;22,00;0,00', 'quantidade'],
    ['02/04/2026;C;PETR4;1,5;22,00;0,00', 'quantidade'],
    ['02/04/2026;C;PETR4;100;22.00;0,00', 'precoUnitario'],
    ['02/04/2026;C;PETR4;100;0,00;0,00', 'preco-nao-positivo'],
    ['02/04/2026;C;PETR4;100;22,00;-1,00', 'custos'],
  ])(
    'recusa %s, no campo %s, com o número da linha',
    (linha, campo) => {
      const texto = csv('02/04/2026;C;PETR4;100;22,00;0,00', linha);

      expect(importarCsv(texto, 'x')).toEqual(
        err({ tipo: 'linha-invalida', linha: 3, campo }),
      );
    },
  );
});
// #endregion

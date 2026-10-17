import { describe, expect, it } from 'vitest';

import { executar } from '../../../src/adaptadores/cli/executar.js';
import { referenciasDaCli } from '../../../src/adaptadores/cli/referencias.js';
import { repositorioEmMemoria } from '../../../src/adaptadores/memoria/repositorio.js';
import { err, ok } from '../../../src/dominio/resultado.js';
import { extrair } from '../../apoio/resultado.js';

// A cena de abril de 2026 como extrato da corretora.
const extrato = [
  'Data;C/V;Ativo;Quantidade;Preço;Custos',
  '02/02/2026;C;PETR4;1.000;22,00;0,00',
  '02/04/2026;C;HGLG11;100;160,00;0,00',
  '15/04/2026;V;PETR4;1.000;25,00;0,00',
  '15/04/2026;V;HGLG11;100;130,00;0,00',
].join('\n');

function terminal(arquivos: Record<string, string> = {}) {
  const repositorio = repositorioEmMemoria();
  const escritas: string[] = [];
  const ambiente = {
    abrir: () => repositorio,
    ler: (caminho: string) =>
      caminho in arquivos
        ? ok(arquivos[caminho] ?? '')
        : err(`Não foi possível ler ${caminho}.`),
    escrever: (linha: string) => escritas.push(linha),
    referencias: extrair(referenciasDaCli()),
  };
  const rodar = (linha: string) => executar(linha.split(' '), ambiente);
  return { rodar, escritas };
}

const opcoes = '--carteira carteira-1 --banco lastro.db';

describe('CLI', () => {
  it('importa o extrato e escreve o relatório do mês', async () => {
    const { rodar, escritas } = terminal({ 'abril.csv': extrato });

    expect(await rodar(`importar abril.csv ${opcoes}`)).toBe(0);
    expect(await rodar(`relatorio 2026-04 ${opcoes}`)).toBe(0);
    expect(escritas[0]).toBe(
      '4 operações registradas na carteira carteira-1.',
    );
    expect(escritas[1]).toBe('Apuração de 04/2026');
    expect(escritas.at(-1)).toBe(
      'DARF 6015: R$ 450,00, vencimento 29/05/2026',
    );
  });

  it.each([
    ['importar abril.csv', 'Recusado: operacao-repetida.'],
    ['importar outro.csv', 'Não foi possível ler outro.csv.'],
    ['importar ruim.csv', 'Linha 2, campo data: valor inválido.'],
    ['relatorio 2026-13', 'Mês inválido: 2026-13. Use AAAA-MM.'],
  ])('%s sai com 1 e diz por quê', async (comando, mensagem) => {
    const ruim =
      'Data;C/V;Ativo;Quantidade;Preço;Custos\n31/02/2026;C;PETR4;1;1,00;0,00';
    const { rodar, escritas } = terminal({
      'abril.csv': extrato,
      'ruim.csv': ruim,
    });
    await rodar(`importar abril.csv ${opcoes}`);

    expect(await rodar(`${comando} ${opcoes}`)).toBe(1);
    expect(escritas.at(-1)).toBe(mensagem);
  });

  it('com a venda de um ativo fora do catálogo, recusa o mês', async () => {
    const fora = [
      'Data;C/V;Ativo;Quantidade;Preço;Custos',
      '02/04/2026;C;XPTO3;10;1,00;0,00',
      '15/04/2026;V;XPTO3;10;2,00;0,00',
    ].join('\n');
    const { rodar, escritas } = terminal({ 'fora.csv': fora });
    await rodar(`importar fora.csv ${opcoes}`);

    expect(await rodar(`relatorio 2026-04 ${opcoes}`)).toBe(1);
    expect(escritas.at(-1)).toMatch(/^Recusado: /);
  });

  it.each([
    '',
    'apagar abril.csv --carteira carteira-1 --banco lastro.db',
    'importar abril.csv --carteira carteira-1',
    'importar abril.csv --banco lastro.db',
    'importar --carteira carteira-1 --banco lastro.db',
    'importar abril.csv x --carteira carteira-1 --banco lastro.db',
    'importar abril.csv --carteira carteira-1 --banco lastro.db --cor',
    'importar abril.csv --carteira  --banco lastro.db',
  ])('"%s" sai com 2 e mostra o uso', async (linha) => {
    const { rodar, escritas } = terminal({ 'abril.csv': extrato });

    expect(await rodar(linha)).toBe(2);
    expect(escritas).toEqual([
      expect.stringMatching(/^Uso:\n {2}lastro importar/),
    ]);
  });
});

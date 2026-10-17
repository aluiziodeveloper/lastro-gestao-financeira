import { Carteira } from '../../src/dominio/carteira.js';
import {
  criarDataDoCalendario,
  type DataDoCalendario,
} from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import type { Operacao } from '../../src/dominio/operacao.js';
import type { Cotacoes } from '../../src/dominio/projecao/dividend-yield.js';
import type { Provento } from '../../src/dominio/proventos/provento.js';
import { Quantidade } from '../../src/dominio/quantidade.js';
import { Ticker } from '../../src/dominio/ticker.js';
import { extrair } from '../apoio/resultado.js';
import { umaCompra } from './construtores.js';
import { mes } from './referencias.js';

// #region carteira-de-renda
// A carteira da Tabela 12.1, em 31/10/2026: 150 cotas de HGLG11, com
// 50 compradas em 20/08/2026; 400 ações de PETR4 e 500 de ITUB4. Os
// proventos vão de setembro de 2025 a outubro de 2026: o HGLG11 paga
// R$ 1,10 por cota todo mês; a PETR4, R$ 0,75 por ação em dezembro,
// março, junho e setembro; o ITUB4, R$ 0,02 por ação de JCP todo mês.
export function carteiraCom(operacoes: readonly Operacao[]): Carteira {
  return operacoes.reduce(
    (carteira, operacao) => extrair(carteira.registrar(operacao)),
    Carteira.abrir(extrair(criarIdDeCarteira('carteira-de-renda'))),
  );
}

export const comprasDaTabela: readonly Operacao[] = [
  umaCompra({
    ticker: 'HGLG11',
    data: '2025-08-01',
    quantidade: 100,
    precoEmCentavos: 158_00n,
  }),
  umaCompra({
    ticker: 'PETR4',
    data: '2025-08-01',
    quantidade: 400,
    precoEmCentavos: 32_00n,
  }),
  umaCompra({
    ticker: 'ITUB4',
    data: '2025-08-01',
    quantidade: 500,
    precoEmCentavos: 34_00n,
  }),
  umaCompra({
    ticker: 'HGLG11',
    data: '2026-08-20',
    quantidade: 50,
    precoEmCentavos: 161_00n,
  }),
];

export const carteiraDaTabela = carteiraCom(comprasDaTabela);

// Os catorze meses de setembro de 2025 a outubro de 2026.
const mesesPagos = Array.from({ length: 14 }, (_, indice) =>
  mes('2025-09').deslocado(indice).primeiroDia().slice(0, 7),
);

export function data(texto: string): DataDoCalendario {
  return extrair(criarDataDoCalendario(texto));
}

function unidades(numero: number): Quantidade {
  return extrair(Quantidade.criar(numero));
}

function ticker(texto: string): Ticker {
  return extrair(Ticker.criar(texto));
}

// O rendimento de agosto sai no dia 14, antes da compra do dia 20, e
// por isso com 100 cotas.
const rendimentos: readonly Provento[] = mesesPagos.map((mes) => {
  const cotas = mes < '2026-09' ? 100 : 150;
  return {
    tipo: 'rendimento-de-fii',
    ticker: ticker('HGLG11'),
    pagamento: data(`${mes}-14`),
    bruto: Dinheiro.deCentavos(BigInt(cotas) * 1_10n),
    cotas: unidades(cotas),
  };
});

const dividendos: readonly Provento[] = mesesPagos
  .filter((mes) => ['12', '03', '06', '09'].includes(mes.slice(5)))
  .map((mes) => ({
    tipo: 'dividendo',
    ticker: ticker('PETR4'),
    pagamento: data(`${mes}-20`),
    bruto: Dinheiro.deCentavos(400n * 75n),
    quantidade: unidades(400),
    anoDoLucro: Number(mes.slice(0, 4)) - 1,
    aprovacao: data(`${mes}-01`),
  }));

const jcps: readonly Provento[] = mesesPagos.map((mes) => ({
  tipo: 'jcp',
  ticker: ticker('ITUB4'),
  pagamento: data(`${mes}-01`),
  bruto: Dinheiro.deCentavos(500n * 2n),
  quantidade: unidades(500),
}));

// As cotações de 31/10/2026: R$ 58.400,00 de valor de mercado.
export const cotacoesDaTabela: Cotacoes = [
  { ticker: ticker('HGLG11'), preco: Dinheiro.deCentavos(160_00n) },
  { ticker: ticker('PETR4'), preco: Dinheiro.deCentavos(36_00n) },
  { ticker: ticker('ITUB4'), preco: Dinheiro.deCentavos(40_00n) },
];

export const proventosDaTabela: readonly Provento[] = [
  ...rendimentos,
  ...dividendos,
  ...jcps,
];
// #endregion

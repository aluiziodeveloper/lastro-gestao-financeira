import { Aliquota } from '../aliquota.js';
import type { CatalogoDeAtivos } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import { garantirExaustividade } from '../exaustividade.js';
import { err, ok, type Result } from '../resultado.js';
import type {
  ErroDeApuracao,
  ResultadoDaCategoria,
  Totais,
} from './apuracao-do-mes.js';
import type { ResultadoDaVenda } from './resultado-da-venda.js';

const zero = Dinheiro.deCentavos(0n);
const vazios: Totais = { totalVendido: zero, resultado: zero };

// O que a apuração acumula enquanto percorre as operações comuns do
// mês: a carteira e os totais de cada classe.
export interface Andamento {
  readonly carteira: Carteira;
  readonly acoes: Totais;
  readonly fii: Totais;
}

export function andamentoInicial(carteira: Carteira): Andamento {
  return { carteira, acoes: vazios, fii: vazios };
}

// #region apuracao-switch
// Cada classe de ativo tem a sua regra; o que ainda não tem regra é
// recusado com nome, e não apurado como ação por engano.
export function somarVenda(
  andamento: Andamento,
  venda: ResultadoDaVenda,
  catalogo: CatalogoDeAtivos,
): Result<Andamento, ErroDeApuracao> {
  const classe = catalogo.classeDe(venda.venda.ticker);
  if (!classe.ok) {
    return classe;
  }
  switch (classe.valor) {
    case 'acao':
      return ok({ ...andamento, acoes: somar(andamento.acoes, venda) });
    case 'fii':
      return ok({ ...andamento, fii: somar(andamento.fii, venda) });
    case 'etf':
      return err({
        tipo: 'classe-ainda-nao-apurada',
        classe: classe.valor,
        ticker: venda.venda.ticker,
      });
    default:
      return garantirExaustividade(classe.valor);
  }
}
// #endregion

function somar(
  totais: Totais,
  { valorDeAlienacao, resultado }: ResultadoDaVenda,
): Totais {
  return {
    totalVendido: totais.totalVendido.somar(valorDeAlienacao),
    resultado: totais.resultado.somar(resultado),
  };
}

const quinzePorCento = Aliquota.de(15n, 100n);
const vintePorCento = Aliquota.de(20n, 100n);

// #region isencao-mensal
// Ações em operação comum: se o total vendido no mês não passa de
// R$ 20.000,00, o ganho do mês inteiro é isento; passou um centavo, o
// ganho inteiro é tributável (Lei 11.033/2004, art. 3º, I).
const limiteDeIsencao = Dinheiro.deCentavos(20_000_00n);
// #endregion

export function categoriasDoMes(
  { acoes, fii }: Andamento,
  dayTrade: Totais,
): ResultadoDaCategoria[] {
  return [
    acoesEmOperacaoComum(acoes),
    tributada('day-trade', dayTrade, vintePorCento),
    tributada('fii', fii, vintePorCento),
  ];
}

function acoesEmOperacaoComum({
  totalVendido,
  resultado,
}: Totais): ResultadoDaCategoria {
  const isenta = !totalVendido.excede(limiteDeIsencao);
  const imposto = isenta ? zero : quinzePorCento.sobreGanho(resultado);
  return {
    categoria: 'acoes-comum',
    totalVendido,
    resultado,
    isenta,
    imposto,
  };
}

// Day trade e FII: 20% sobre o resultado do mês, sem isenção (IN RFB
// 1.585/2015, art. 65, § 11, e art. 37; art. 59, § 2º, I).
function tributada(
  categoria: 'day-trade' | 'fii',
  { totalVendido, resultado }: Totais,
  aliquota: Aliquota,
): ResultadoDaCategoria {
  return {
    categoria,
    totalVendido,
    resultado,
    isenta: false,
    imposto: aliquota.sobreGanho(resultado),
  };
}

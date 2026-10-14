import { Aliquota } from '../aliquota.js';
import type { CatalogoDeAtivos } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import { garantirExaustividade } from '../exaustividade.js';
import { err, ok, type Result } from '../resultado.js';
import type {
  ErroDeApuracao,
  ResultadoDaCategoria,
} from './apuracao-do-mes.js';
import type { ResultadoDaVenda } from './resultado-da-venda.js';
import type { ResultadoDoDayTrade } from './resultado-do-day-trade.js';

// O que a apuração acumula enquanto percorre as operações do mês.
export interface Andamento {
  readonly carteira: Carteira;
  readonly totalVendido: Dinheiro;
  readonly resultado: Dinheiro;
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
      return ok(somarAcao(andamento, venda));
    case 'fii':
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

function somarAcao(
  andamento: Andamento,
  { valorDeAlienacao, resultado }: ResultadoDaVenda,
): Andamento {
  return {
    ...andamento,
    totalVendido: andamento.totalVendido.somar(valorDeAlienacao),
    resultado: andamento.resultado.somar(resultado),
  };
}

const zero = Dinheiro.deCentavos(0n);
const quinzePorCento = Aliquota.de(15n, 100n);
const vintePorCento = Aliquota.de(20n, 100n);

// #region isencao-mensal
// Ações em operação comum: se o total vendido no mês não passa de
// R$ 20.000,00, o ganho do mês inteiro é isento; passou um centavo, o
// ganho inteiro é tributável (Lei 11.033/2004, art. 3º, I).
const limiteDeIsencao = Dinheiro.deCentavos(20_000_00n);
// #endregion

export function acoesEmOperacaoComum({
  totalVendido,
  resultado,
}: Andamento): ResultadoDaCategoria {
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

// Day trade: 20% sobre o resultado do mês, sem isenção (IN RFB
// 1.585/2015, art. 65, § 11; art. 59, § 2º, I).
export function noDayTrade({
  totalVendido,
  resultado,
}: ResultadoDoDayTrade): ResultadoDaCategoria {
  return {
    categoria: 'day-trade',
    totalVendido,
    resultado,
    isenta: false,
    imposto: vintePorCento.sobreGanho(resultado),
  };
}

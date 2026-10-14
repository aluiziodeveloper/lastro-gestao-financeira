import type { CatalogoDeAtivos } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import type { Dinheiro } from '../dinheiro.js';
import { garantirExaustividade } from '../exaustividade.js';
import { err, ok, type Result } from '../resultado.js';
import type { ErroDeApuracao } from './apuracao-do-mes.js';
import type { ResultadoDaVenda } from './resultado-da-venda.js';

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

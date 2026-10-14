import type { CatalogoDeAtivos } from '../ativo.js';
import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import type { Operacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import type {
  ErroDeApuracao,
  NomeDaCategoria,
  Totais,
} from './apuracao-do-mes.js';
import { categoriaComum } from './categorias.js';
import {
  registrarNaCarteira,
  type ResultadoDaVenda,
} from './resultado-da-venda.js';

// #region lancamentos
// Cada venda do mês vira um lançamento na categoria a que pertence.
export interface Lancamento extends Totais {
  readonly categoria: NomeDaCategoria;
}

export interface Andamento {
  readonly carteira: Carteira;
  readonly lancamentos: readonly Lancamento[];
}
// #endregion

const zero = Dinheiro.deCentavos(0n);

export function totaisDe(
  nome: NomeDaCategoria,
  lancamentos: readonly Lancamento[],
): Totais {
  return lancamentos
    .filter((lancamento) => lancamento.categoria === nome)
    .reduce(
      (totais, lancamento) => ({
        totalVendido: totais.totalVendido.somar(
          lancamento.totalVendido,
        ),
        resultado: totais.resultado.somar(lancamento.resultado),
      }),
      { totalVendido: zero, resultado: zero },
    );
}

export function percorrer(
  carteira: Carteira,
  operacoes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<Andamento, ErroDeApuracao> {
  const inicio: Result<Andamento, ErroDeApuracao> = ok({
    carteira,
    lancamentos: [],
  });
  return operacoes.reduce(
    (andamento, operacao) =>
      andamento.ok
        ? registrar(andamento.valor, operacao, catalogo)
        : andamento,
    inicio,
  );
}

function registrar(
  andamento: Andamento,
  operacao: Operacao,
  catalogo: CatalogoDeAtivos,
): Result<Andamento, ErroDeApuracao> {
  const registro = registrarNaCarteira(andamento.carteira, operacao);
  if (!registro.ok) {
    return registro;
  }
  const { carteira, venda } = registro.valor;
  if (venda === undefined) {
    return ok({ ...andamento, carteira });
  }
  return lancar({ ...andamento, carteira }, venda, catalogo);
}

// A venda comum vai para a categoria da classe do ativo.
function lancar(
  andamento: Andamento,
  { venda, valorDeAlienacao, resultado }: ResultadoDaVenda,
  catalogo: CatalogoDeAtivos,
): Result<Andamento, ErroDeApuracao> {
  const classe = catalogo.classeDe(venda.ticker);
  if (!classe.ok) {
    return classe;
  }
  const lancamento: Lancamento = {
    categoria: categoriaComum(classe.valor),
    totalVendido: valorDeAlienacao,
    resultado,
  };
  return ok({
    ...andamento,
    lancamentos: [...andamento.lancamentos, lancamento],
  });
}

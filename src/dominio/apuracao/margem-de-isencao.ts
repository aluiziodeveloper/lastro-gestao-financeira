import type { CatalogoDeAtivos, ErroDeCatalogo } from '../ativo.js';
import { Dinheiro } from '../dinheiro.js';
import { type Operacao, valorBrutoDaOperacao } from '../operacao.js';
import { ok, type Result } from '../resultado.js';
import type { ErroDeApuracao } from './apuracao-do-mes.js';
import { categoriaComum, limiteDeIsencao } from './categorias.js';
import { separarDayTrade } from './day-trade.js';

const zero = Dinheiro.deCentavos(0n);

// #region margem-de-isencao
// Desafio do Capítulo 9: quanto ainda se pode vender em ações, em
// operação comum, sem perder a isenção do mês. A margem é uma
// consulta: sai das operações do mês, e não fica guardada em lugar
// nenhum. O day trade sai antes, pela mesma separação da apuração.
export function margemDeIsencao(
  operacoesDoMes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<Dinheiro, ErroDeApuracao> {
  const separacao = separarDayTrade(operacoesDoMes);
  if (!separacao.ok) {
    return separacao;
  }
  const vendido = vendidoEmAcoes(separacao.valor.comum, catalogo);
  if (!vendido.ok) {
    return vendido;
  }
  return ok(
    vendido.valor.excede(limiteDeIsencao)
      ? zero
      : limiteDeIsencao.subtrair(vendido.valor),
  );
}
// #endregion

// O valor de alienação das vendas que caem em ações em operação
// comum: a classe vem do catálogo, e a categoria, da mesma tradução
// que a apuração usa.
function vendidoEmAcoes(
  operacoes: readonly Operacao[],
  catalogo: CatalogoDeAtivos,
): Result<Dinheiro, ErroDeCatalogo> {
  const inicio: Result<Dinheiro, ErroDeCatalogo> = ok(zero);
  return operacoes.reduce(
    (vendido, operacao) =>
      vendido.ok ? somar(vendido.valor, operacao, catalogo) : vendido,
    inicio,
  );
}

function somar(
  vendido: Dinheiro,
  operacao: Operacao,
  catalogo: CatalogoDeAtivos,
): Result<Dinheiro, ErroDeCatalogo> {
  if (operacao.tipo === 'compra') {
    return ok(vendido);
  }
  const classe = catalogo.classeDe(operacao.ticker);
  if (!classe.ok) {
    return classe;
  }
  if (categoriaComum(classe.valor) !== 'acoes-comum') {
    return ok(vendido);
  }
  return ok(
    vendido.somar(
      valorBrutoDaOperacao(operacao.precoUnitario, operacao.quantidade),
    ),
  );
}

import type { CatalogoDeAtivos, ErroDeCatalogo } from '../ativo.js';
import type { ClasseDeAtivo } from '../classe-de-ativo.js';
import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import {
  type Cotacoes,
  type ErroDeCotacao,
  valorDaPosicao,
} from '../mercado/cotacoes.js';
import { ok, type Result } from '../resultado.js';

// #region composicao
// Quanto a carteira vale em cada classe, pelas cotações informadas e
// pela classe do catálogo. O Record obriga a ter as três classes.
export interface Composicao {
  readonly total: Dinheiro;
  readonly porClasse: Readonly<Record<ClasseDeAtivo, Dinheiro>>;
}

export type ErroDeComposicao = ErroDeCotacao | ErroDeCatalogo;

const zero = Dinheiro.deCentavos(0n);

export function composicaoDe(
  carteira: Carteira,
  cotacoes: Cotacoes,
  catalogo: CatalogoDeAtivos,
): Result<Composicao, ErroDeComposicao> {
  const inicio: Composicao = {
    total: zero,
    porClasse: { acao: zero, fii: zero, etf: zero },
  };
  return carteira
    .ativos()
    .reduce<Result<Composicao, ErroDeComposicao>>((atual, ativo) => {
      if (!atual.ok) {
        return atual;
      }
      const classe = catalogo.classeDe(ativo);
      if (!classe.ok) {
        return classe;
      }
      const valor = valorDaPosicao(carteira, cotacoes, ativo);
      return valor.ok
        ? ok(somar(atual.valor, classe.valor, valor.valor))
        : valor;
    }, ok(inicio));
}

function somar(
  { total, porClasse }: Composicao,
  classe: ClasseDeAtivo,
  valor: Dinheiro,
): Composicao {
  return {
    total: total.somar(valor),
    porClasse: {
      ...porClasse,
      [classe]: porClasse[classe].somar(valor),
    },
  };
}
// #endregion

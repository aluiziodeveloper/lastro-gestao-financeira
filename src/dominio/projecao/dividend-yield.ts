import type { ModoDeArredondamento } from '../arredondamento.js';
import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import type { Marcado } from '../marca.js';
import { err, ok, type Result } from '../resultado.js';
import type { Ticker } from '../ticker.js';
import { type RendaProjetada, rendaDos } from './renda-projetada.js';

// #region dividend-yield
// A cotação é um dado de entrada: o Lastro não busca preços, e quem
// pergunta o yield diz a quanto cada ativo está.
export interface Cotacao {
  readonly ticker: Ticker;
  readonly preco: Dinheiro;
}

export type Cotacoes = readonly Cotacao[];

// Um ponto-base é um centésimo de ponto percentual: 825 pontos-base
// são 8,25%. O inteiro deixa a vírgula para a hora de mostrar.
export type PontosBase = Marcado<bigint, 'PontosBase'>;

export type ErroDoYield =
  | { readonly tipo: 'sem-cotacao'; readonly ticker: Ticker }
  | { readonly tipo: 'sem-valor-de-mercado' };

const arredondamentoDoYield: ModoDeArredondamento = 'meio-para-cima';

// O dividend yield dos últimos doze meses: os proventos da janela,
// escalados pela posição de hoje, que são a renda projetada, sobre o
// valor de mercado da posição. Quem pergunta diz quais ativos entram:
// um só, um grupo ou a carteira inteira.
export function dividendYield(
  renda: RendaProjetada,
  carteira: Carteira,
  cotacoes: Cotacoes,
  ativos: readonly Ticker[],
): Result<PontosBase, ErroDoYield> {
  const valor = valorDeMercado(carteira, cotacoes, ativos);
  if (!valor.ok) {
    return valor;
  }
  if (!valor.valor.ehPositivo()) {
    return err({ tipo: 'sem-valor-de-mercado' });
  }
  const pontos = rendaDos(renda, ativos).razaoSobre(
    valor.valor,
    10_000n,
    arredondamentoDoYield,
  );
  return ok(pontos as PontosBase);
}

// A posição de hoje de cada ativo pela sua cotação. Faltar a cotação
// de um ativo pedido é erro, e não zero: o yield sairia maior.
function valorDeMercado(
  carteira: Carteira,
  cotacoes: Cotacoes,
  ativos: readonly Ticker[],
): Result<Dinheiro, ErroDoYield> {
  return ativos.reduce<Result<Dinheiro, ErroDoYield>>(
    (soma, ativo) => {
      if (!soma.ok) {
        return soma;
      }
      const cotacao = cotacoes.find(({ ticker }) =>
        ticker.equivaleA(ativo),
      );
      if (cotacao === undefined) {
        return err({ tipo: 'sem-cotacao', ticker: ativo });
      }
      const posicao = cotacao.preco.multiplicarPorUnidades(
        carteira.quantidadeDe(ativo),
      );
      return ok(soma.valor.somar(posicao));
    },
    ok(Dinheiro.deCentavos(0n)),
  );
}
// #endregion

// #region pontos-base-em-percentual
// 825 pontos-base se leem 8,25%; 60, 0,60%.
export function emPercentual(pontos: PontosBase): string {
  const inteiros = String(pontos / 100n);
  const centesimos = String(pontos % 100n).padStart(2, '0');
  return `${inteiros},${centesimos}%`;
}
// #endregion

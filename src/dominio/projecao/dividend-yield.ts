import type { ModoDeArredondamento } from '../arredondamento.js';
import type { Carteira } from '../carteira.js';
import {
  type Cotacoes,
  type ErroDeCotacao,
  valorDeMercado,
} from '../mercado/cotacoes.js';
import {
  cemPorCento,
  type PontosBase,
} from '../mercado/pontos-base.js';
import { err, ok, type Result } from '../resultado.js';
import type { Ticker } from '../ticker.js';
import { type RendaProjetada, rendaDos } from './renda-projetada.js';

// #region dividend-yield
export type ErroDoYield =
  ErroDeCotacao | { readonly tipo: 'sem-valor-de-mercado' };

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
    cemPorCento,
    arredondamentoDoYield,
  );
  return ok(pontos as PontosBase);
}
// #endregion

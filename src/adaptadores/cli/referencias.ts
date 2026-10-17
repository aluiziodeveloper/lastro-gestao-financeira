import { CatalogoDeAtivos } from '../../dominio/ativo.js';
import { calendarioNacional } from '../../dominio/calendario.js';
import type { ClasseDeAtivo } from '../../dominio/classe-de-ativo.js';
import type { DadosDeReferencia } from '../../dominio/dados-de-referencia.js';
import { definicoesDoLastro } from '../../dominio/regime/regimes.js';
import {
  type ErroDeRegimes,
  RegimesTributarios,
} from '../../dominio/regime/regimes-tributarios.js';
import { ok, type Result } from '../../dominio/resultado.js';
import { Ticker } from '../../dominio/ticker.js';

// #region referencias-da-cli
// Os dados de referência que a CLI usa: a lei e o calendário do
// domínio, e um catálogo fixo com os ativos dos exemplos do livro. Um
// ativo fora dele faz a apuração recusar o mês, com o ticker no erro.
const ativos: readonly (readonly [string, ClasseDeAtivo])[] = [
  ['PETR4', 'acao'],
  ['VALE3', 'acao'],
  ['ITSA4', 'acao'],
  ['HGLG11', 'fii'],
  ['KNRI11', 'fii'],
  ['BOVA11', 'etf'],
];

export function referenciasDaCli(): Result<
  DadosDeReferencia,
  ErroDeRegimes
> {
  const regimes = RegimesTributarios.criar(definicoesDoLastro);
  if (!regimes.ok) {
    return regimes;
  }
  const catalogo = ativos.reduce((parcial, [texto, classe]) => {
    const ticker = Ticker.criar(texto);
    return ticker.ok ? parcial.com(ticker.valor, classe) : parcial;
  }, CatalogoDeAtivos.vazio());
  const calendario = calendarioNacional;
  return ok({ catalogo, regimes: regimes.valor, calendario });
}
// #endregion

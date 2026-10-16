import type { DadosDeReferencia } from '../dados-de-referencia.js';
import { Dinheiro } from '../dinheiro.js';
import { deduzirIrrf, retidoNoMes } from '../irrf/imposto-retido.js';
import { compensar } from '../prejuizo/compensacao.js';
import type { RegimeTributario } from '../regime/regime-tributario.js';
import type { RegimesTributarios } from '../regime/regimes-tributarios.js';
import { ok, type Result } from '../resultado.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
  MovimentoDoMes,
  ResultadoDaCategoria,
} from './apuracao-do-mes.js';
import { categoriasDo } from './categorias.js';
import {
  conferirSequencia,
  type EstadoDaApuracao,
} from './estado-da-apuracao.js';
import type { Andamento } from './lancamentos.js';
import { lancarOMes } from './lancamentos-do-mes.js';
import type { MesDeApuracao } from './mes-de-apuracao.js';

// #region apuracao-mensal
// Serviço de domínio: a apuração não pertence à carteira nem ao
// catálogo. Ela abre o mês (a sequência, a lei e o imposto retido),
// lança as vendas e fecha: as categorias apuram com o prejuízo do
// estado, e o retido abate o imposto. Tudo o que o cálculo usa chega
// pelos parâmetros: o mesmo estado, com o mesmo movimento e os mesmos
// dados, dá sempre a mesma apuração.
export function apurarMes(
  estado: EstadoDaApuracao,
  movimento: MovimentoDoMes,
  { catalogo, regimes }: DadosDeReferencia,
): Result<ApuracaoDoMes, ErroDeApuracao> {
  const abertura = abrir(estado, movimento, regimes);
  if (!abertura.ok) {
    return abertura;
  }
  const { carteira } = estado;
  const andamento = lancarOMes(carteira, movimento.operacoes, catalogo);
  if (!andamento.ok) {
    return andamento;
  }
  return ok(fechar(estado, abertura.valor, andamento.valor));
}

// O que o mês precisa saber antes de lançar as vendas.
interface Abertura {
  readonly mes: MesDeApuracao;
  readonly regime: RegimeTributario;
  readonly retido: Dinheiro;
}

function abrir(
  estado: EstadoDaApuracao,
  { mes, retencoes }: MovimentoDoMes,
  regimes: RegimesTributarios,
): Result<Abertura, ErroDeApuracao> {
  const sequencia = conferirSequencia(mes, estado);
  if (!sequencia.ok) {
    return sequencia;
  }
  const regime = regimes.vigenteEm(mes.primeiroDia());
  if (!regime.ok) {
    return regime;
  }
  const retido = retidoNoMes(mes, retencoes);
  if (!retido.ok) {
    return retido;
  }
  return ok({ mes, regime: regime.valor, retido: retido.valor });
}

// As categorias do regime apuram os lançamentos com o prejuízo do
// estado; o imposto retido abate a soma dos impostos; o mês devolve o
// estado seguinte.
function fechar(
  estado: EstadoDaApuracao,
  { mes, regime, retido }: Abertura,
  { carteira, lancamentos }: Andamento,
): ApuracaoDoMes {
  const { categorias, prejuizo } = compensar(
    categoriasDo(regime.apuracao),
    lancamentos,
    estado.prejuizo,
  );
  const imposto = somaDosImpostos(categorias);
  const irrf = deduzirIrrf(mes, imposto, estado.irrf, retido);
  return {
    mes,
    categorias,
    irrf,
    estado: { apuradoAte: mes, carteira, prejuizo, irrf: irrf.saldo },
  };
}
// #endregion

function somaDosImpostos(
  categorias: readonly ResultadoDaCategoria[],
): Dinheiro {
  return categorias.reduce(
    (total, { imposto }) => total.somar(imposto),
    Dinheiro.deCentavos(0n),
  );
}

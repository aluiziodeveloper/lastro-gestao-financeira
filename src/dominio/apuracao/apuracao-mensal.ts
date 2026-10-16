import type { DadosDeReferencia } from '../dados-de-referencia.js';
import { Dinheiro } from '../dinheiro.js';
import { recolher } from '../darf/darf.js';
import { deduzirIrrf } from '../irrf/imposto-retido.js';
import { compensar } from '../prejuizo/compensacao.js';
import { ok, type Result } from '../resultado.js';
import { type Abertura, abrir } from './abertura-do-mes.js';
import type {
  ApuracaoDoMes,
  ErroDeApuracao,
  MovimentoDoMes,
  ResultadoDaCategoria,
} from './apuracao-do-mes.js';
import { categoriasDo } from './categorias.js';
import type { EstadoDaApuracao } from './estado-da-apuracao.js';
import type { Andamento } from './lancamentos.js';
import { lancarOMes } from './lancamentos-do-mes.js';

// #region apuracao-mensal
// Serviço de domínio: a apuração não pertence à carteira nem ao
// catálogo. Ela abre o mês (a sequência, a lei, o imposto retido e o
// vencimento), lança as vendas e fecha: as categorias apuram com o
// prejuízo do estado, o retido abate o imposto, e o que sobra vai ao
// DARF. Tudo o que o cálculo usa chega
// pelos parâmetros: o mesmo estado, com o mesmo movimento e os mesmos
// dados, dá sempre a mesma apuração.
export function apurarMes(
  estado: EstadoDaApuracao,
  movimento: MovimentoDoMes,
  referencias: DadosDeReferencia,
): Result<ApuracaoDoMes, ErroDeApuracao> {
  const abertura = abrir(estado, movimento, referencias);
  if (!abertura.ok) {
    return abertura;
  }
  const { carteira } = estado;
  const { operacoes } = movimento;
  const andamento = lancarOMes(
    carteira,
    operacoes,
    referencias.catalogo,
  );
  if (!andamento.ok) {
    return andamento;
  }
  return ok(fechar(estado, abertura.valor, andamento.valor));
}

// As categorias do regime apuram os lançamentos com o prejuízo do
// estado; o imposto retido abate a soma dos impostos; o mês devolve o
// estado seguinte.
function fechar(
  estado: EstadoDaApuracao,
  { mes, regime, retido, vencimento }: Abertura,
  { carteira, lancamentos }: Andamento,
): ApuracaoDoMes {
  const { categorias, prejuizo } = compensar(
    categoriasDo(regime.apuracao),
    lancamentos,
    estado.prejuizo,
  );
  const imposto = somaDosImpostos(categorias);
  const irrf = deduzirIrrf(mes, imposto, estado.irrf, retido);
  const devido = imposto.subtrair(irrf.deduzido);
  return {
    mes,
    categorias,
    imposto,
    irrf,
    recolhimento: recolher(mes, devido, vencimento),
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

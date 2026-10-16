import {
  pendenteApos,
  recolher,
  type Recolhimento,
} from '../darf/darf.js';
import { Dinheiro } from '../dinheiro.js';
import {
  type DeducaoDoIrrf,
  deduzirIrrf,
} from '../irrf/imposto-retido.js';
import { compensar } from '../prejuizo/compensacao.js';
import type { Abertura } from './abertura-do-mes.js';
import type {
  ApuracaoDoMes,
  ResultadoDaCategoria,
} from './apuracao-do-mes.js';
import { categoriasDo } from './categorias.js';
import type { EstadoDaApuracao } from './estado-da-apuracao.js';
import type { Andamento } from './lancamentos.js';

// #region fechamento-do-mes
// As categorias do regime apuram os lançamentos com o prejuízo do
// estado, o mês paga o que deve e devolve o estado seguinte.
export function fechar(
  estado: EstadoDaApuracao,
  abertura: Abertura,
  { carteira, lancamentos }: Andamento,
): ApuracaoDoMes {
  const { mes, regime } = abertura;
  const { categorias, prejuizo } = compensar(
    categoriasDo(regime.apuracao),
    lancamentos,
    estado.prejuizo,
  );
  const imposto = somaDosImpostos(categorias);
  const pago = pagar(imposto, estado, abertura);
  return {
    mes,
    categorias,
    imposto,
    irrf: pago.irrf,
    recolhimento: pago.recolhimento,
    estado: { apuradoAte: mes, carteira, prejuizo, ...pago.saldos },
  };
}

// O pagamento do mês e os saldos que ele deixa para o seguinte.
interface Pagamento {
  readonly irrf: DeducaoDoIrrf;
  readonly recolhimento: Recolhimento;
  readonly saldos: SaldosDoPagamento;
}

interface SaldosDoPagamento {
  readonly irrf: Dinheiro;
  readonly darfPendente: Dinheiro;
}

// O imposto retido abate o imposto; o que sobra, com o que ficou
// pendente, vai ao DARF.
function pagar(
  imposto: Dinheiro,
  { irrf: saldoDoIrrf, darfPendente }: EstadoDaApuracao,
  { mes, retido, vencimento }: Abertura,
): Pagamento {
  const irrf = deduzirIrrf(mes, imposto, saldoDoIrrf, retido);
  const devido = imposto.subtrair(irrf.deduzido);
  const recolhimento = recolher(mes, devido, darfPendente, vencimento);
  const saldos: SaldosDoPagamento = {
    irrf: irrf.saldo,
    darfPendente: pendenteApos(recolhimento),
  };
  return { irrf, recolhimento, saldos };
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

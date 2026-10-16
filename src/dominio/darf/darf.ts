import type { MesDeApuracao } from '../apuracao/mes-de-apuracao.js';
import type { DataDoCalendario } from '../data-do-calendario.js';
import { Dinheiro } from '../dinheiro.js';

// #region darf-calculo
// O DARF dos ganhos em bolsa da pessoa física: código de receita 6015
// (Perguntas e Respostas IRPF 2026, pergunta 730), o mês apurado, o
// valor e o vencimento, o último dia útil do mês seguinte ao da
// apuração (IN RFB 1.585/2015, art. 56, § 5º).
export interface Darf {
  readonly codigo: '6015';
  readonly periodo: MesDeApuracao;
  readonly valor: Dinheiro;
  readonly vencimento: DataDoCalendario;
}

// O que o mês manda recolher: um DARF, nada, ou um valor que espera
// o mês seguinte por não chegar ao mínimo.
export type Recolhimento =
  | { readonly tipo: 'darf'; readonly darf: Darf }
  | { readonly tipo: 'sem-imposto' }
  | { readonly tipo: 'abaixo-do-minimo'; readonly acumulado: Dinheiro };
// #endregion

// #region darf-minimo
// Abaixo de R$ 10,00 não se recolhe: o valor soma ao do mês seguinte,
// no mesmo código, até chegar a R$ 10,00, e é pago no prazo desse mês
// (Lei 9.430/1996, art. 68, § 1º). O mínimo não depende do regime de
// ganhos, e por isso não mora nele.
export const valorMinimoDoDarf = Dinheiro.deCentavos(10_00n);

const zero = Dinheiro.deCentavos(0n);

// O valor é o imposto das categorias menos o imposto retido deduzido,
// mais o que ficou pendente dos meses anteriores.
export function recolher(
  periodo: MesDeApuracao,
  devido: Dinheiro,
  pendente: Dinheiro,
  vencimento: DataDoCalendario,
): Recolhimento {
  const valor = devido.somar(pendente);
  if (!valor.ehPositivo()) {
    return { tipo: 'sem-imposto' };
  }
  if (valorMinimoDoDarf.excede(valor)) {
    return { tipo: 'abaixo-do-minimo', acumulado: valor };
  }
  const darf: Darf = { codigo: '6015', periodo, valor, vencimento };
  return { tipo: 'darf', darf };
}

// O que fica pendente para o mês seguinte.
export function pendenteApos(recolhimento: Recolhimento): Dinheiro {
  return recolhimento.tipo === 'abaixo-do-minimo'
    ? recolhimento.acumulado
    : zero;
}
// #endregion

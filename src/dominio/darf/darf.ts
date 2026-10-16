import type { MesDeApuracao } from '../apuracao/mes-de-apuracao.js';
import type { DataDoCalendario } from '../data-do-calendario.js';
import type { Dinheiro } from '../dinheiro.js';

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

// O que o mês manda recolher: um DARF ou nada. A união cresce no
// próximo commit, com o valor abaixo do mínimo.
export type Recolhimento =
  | { readonly tipo: 'darf'; readonly darf: Darf }
  | { readonly tipo: 'sem-imposto' };

// O valor é o imposto das categorias menos o imposto retido deduzido.
export function recolher(
  periodo: MesDeApuracao,
  devido: Dinheiro,
  vencimento: DataDoCalendario,
): Recolhimento {
  if (!devido.ehPositivo()) {
    return { tipo: 'sem-imposto' };
  }
  const darf: Darf = {
    codigo: '6015',
    periodo,
    valor: devido,
    vencimento,
  };
  return { tipo: 'darf', darf };
}
// #endregion

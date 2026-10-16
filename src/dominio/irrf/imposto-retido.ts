import type { MesDeApuracao } from '../apuracao/mes-de-apuracao.js';
import type { DataDoCalendario } from '../data-do-calendario.js';
import { Dinheiro } from '../dinheiro.js';
import { err, ok, type Result } from '../resultado.js';

// #region imposto-retido
// O imposto que a corretora reteve, como a nota de corretagem informa:
// 0,005% das vendas comuns e de FII (IN RFB 1.585/2015, art. 63) ou
// 1% do resultado do day trade (art. 65). O Lastro não o calcula: a
// retenção é da corretora, e o valor vem da nota.
export type TipoDeRetencao = 'vendas' | 'day-trade';

export interface ImpostoRetido {
  readonly tipo: TipoDeRetencao;
  readonly data: DataDoCalendario;
  readonly valor: Dinheiro;
}

export type ErroDeRetencao =
  | { readonly tipo: 'retencao-fora-do-mes'; readonly data: string }
  | { readonly tipo: 'retencao-negativa'; readonly data: string };

const zero = Dinheiro.deCentavos(0n);

// O total retido nas notas do mês. Uma retenção de outro mês ou com
// valor negativo é um erro de quem montou o mês, e não um zero.
export function retidoNoMes(
  mes: MesDeApuracao,
  retencoes: readonly ImpostoRetido[],
): Result<Dinheiro, ErroDeRetencao> {
  const foraDoMes = retencoes.find(({ data }) => !mes.contem(data));
  if (foraDoMes !== undefined) {
    return err({ tipo: 'retencao-fora-do-mes', data: foraDoMes.data });
  }
  const negativa = retencoes.find(({ valor }) => valor.ehNegativo());
  if (negativa !== undefined) {
    return err({ tipo: 'retencao-negativa', data: negativa.data });
  }
  return ok(
    retencoes.reduce((total, { valor }) => total.somar(valor), zero),
  );
}
// #endregion

// #region irrf-deducao
// O que aconteceu com o imposto retido no mês: quanto abateu o
// imposto, quanto fica para os meses seguintes e quanto se perdeu.
export interface DeducaoDoIrrf {
  readonly retido: Dinheiro;
  readonly deduzido: Dinheiro;
  readonly saldo: Dinheiro;
  readonly encerrado: Dinheiro;
}

// O retido do mês e o saldo dos meses anteriores abatem o imposto do
// mês (art. 63, § 8º, I e II; art. 65, § 8º, I e II). O que sobra em
// dezembro se encerra: para o day trade, a Receita só admite a
// compensação até o fim do ano (Perguntas e Respostas IRPF 2026,
// pergunta 715). O Lastro aplica a mesma regra às duas retenções,
// embora a de 0,005% possa ir à declaração anual (art. 63, § 8º, III).
export function deduzirIrrf(
  mes: MesDeApuracao,
  imposto: Dinheiro,
  saldoAnterior: Dinheiro,
  retido: Dinheiro,
): DeducaoDoIrrf {
  const disponivel = saldoAnterior.somar(retido);
  const deduzido = disponivel.excede(imposto) ? imposto : disponivel;
  const sobra = disponivel.subtrair(deduzido);
  const encerrado = mes.ehDezembro() ? sobra : zero;
  return {
    retido,
    deduzido,
    saldo: sobra.subtrair(encerrado),
    encerrado,
  };
}
// #endregion

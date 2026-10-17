import type { DataDoCalendario } from '../data-do-calendario.js';
import type { Dinheiro } from '../dinheiro.js';
import type { Quantidade } from '../quantidade.js';
import type { Ticker } from '../ticker.js';

// #region provento-uniao
// Um provento é o que um ativo paga a quem o tem: o valor bruto, na
// data do pagamento. Cada tipo de provento é um membro da união, com
// o seu tratamento fiscal.
// O dividendo traz também o ano do lucro que o gerou e a data em que
// a distribuição foi aprovada, que decidem a transição da lei de 2026.
// A quantidade é a de ações que davam direito ao provento.
export interface Dividendo {
  readonly tipo: 'dividendo';
  readonly ticker: Ticker;
  readonly pagamento: DataDoCalendario;
  readonly bruto: Dinheiro;
  readonly quantidade: Quantidade;
  readonly anoDoLucro: number;
  readonly aprovacao: DataDoCalendario;
}

// Juros sobre capital próprio: a data é a do pagamento ou do crédito,
// e a quantidade, a de ações que davam direito a eles.
export interface Jcp {
  readonly tipo: 'jcp';
  readonly ticker: Ticker;
  readonly pagamento: DataDoCalendario;
  readonly bruto: Dinheiro;
  readonly quantidade: Quantidade;
}

// Rendimento de FII: as cotas são as que o investidor tinha quando
// ganhou o direito ao rendimento.
export interface RendimentoDeFii {
  readonly tipo: 'rendimento-de-fii';
  readonly ticker: Ticker;
  readonly pagamento: DataDoCalendario;
  readonly bruto: Dinheiro;
  readonly cotas: Quantidade;
}

export type Provento = Dividendo | Jcp | RendimentoDeFii;

// O que o provento deixa ao investidor: quanto a fonte reteve e
// quanto sobrou, com o nome do tratamento que a lei lhe dá.
export interface TratamentoDoProvento {
  readonly provento: Provento;
  readonly tratamento: 'isento' | 'exclusivo-na-fonte';
  readonly retido: Dinheiro;
  readonly liquido: Dinheiro;
}
// #endregion

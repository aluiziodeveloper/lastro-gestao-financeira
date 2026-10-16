import type { DadosDeReferencia } from '../dados-de-referencia.js';
import type { DataDoCalendario } from '../data-do-calendario.js';
import { Dinheiro } from '../dinheiro.js';
import { garantirExaustividade } from '../exaustividade.js';
import type { ErroSemRegime } from '../regime/regimes-tributarios.js';
import { ok, type Result } from '../resultado.js';
import type { Ticker } from '../ticker.js';

// #region provento-uniao
// Um provento é o que um ativo paga a quem o tem: o valor bruto, na
// data do pagamento. Cada tipo de provento é um membro da união, com
// o seu tratamento fiscal.
export interface Dividendo {
  readonly tipo: 'dividendo';
  readonly ticker: Ticker;
  readonly pagamento: DataDoCalendario;
  readonly bruto: Dinheiro;
}

export type Provento = Dividendo;

// O que o provento deixa ao investidor: quanto a fonte reteve e
// quanto sobrou, com o nome do tratamento que a lei lhe dá.
export interface TratamentoDoProvento {
  readonly provento: Provento;
  readonly tratamento: 'isento';
  readonly retido: Dinheiro;
  readonly liquido: Dinheiro;
}
// #endregion

// #region tratar-provento
// A lei do provento é a da data do pagamento. Antes do primeiro
// regime, não há lei conhecida, e o tratamento não é calculado.
export function tratarProvento(
  provento: Provento,
  referencias: DadosDeReferencia,
): Result<TratamentoDoProvento, ErroSemRegime> {
  const regime = referencias.regimes.vigenteEm(provento.pagamento);
  if (!regime.ok) {
    return regime;
  }
  // A união tem um membro só, e o lint vê que a comparação é sempre
  // verdadeira. O switch fica: cada provento novo entra aqui.
  /* eslint-disable @typescript-eslint/no-unnecessary-condition */
  switch (provento.tipo) {
    case 'dividendo':
      return ok(isento(provento));
    default:
      return garantirExaustividade(provento.tipo);
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}
// #endregion

function isento(provento: Provento): TratamentoDoProvento {
  return {
    provento,
    tratamento: 'isento',
    retido: Dinheiro.deCentavos(0n),
    liquido: provento.bruto,
  };
}

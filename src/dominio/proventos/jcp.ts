import type { RegimeTributario } from '../regime/regime-tributario.js';
import type { Jcp, TratamentoDoProvento } from './provento.js';
import { exclusivoNaFonte } from './tratamentos.js';

// #region jcp-retencao
// O JCP é tributado só na fonte, sem ajuste na declaração, pela
// alíquota do regime da data do pagamento ou do crédito.
export function tratarJcp(
  jcp: Jcp,
  regime: RegimeTributario,
): TratamentoDoProvento {
  return exclusivoNaFonte(jcp, regime.proventos.jcp);
}
// #endregion

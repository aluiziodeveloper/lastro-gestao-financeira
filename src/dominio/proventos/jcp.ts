import type { RegimeTributario } from '../regime/regime-tributario.js';
import type { Jcp, TratamentoDoProvento } from './provento.js';

// #region jcp-retencao
// O JCP é tributado só na fonte, sem ajuste na declaração, pela
// alíquota do regime da data do pagamento ou do crédito.
export function tratarJcp(
  jcp: Jcp,
  regime: RegimeTributario,
): TratamentoDoProvento {
  const retido = regime.proventos.jcp.sobre(jcp.bruto);
  return {
    provento: jcp,
    tratamento: 'exclusivo-na-fonte',
    retido,
    liquido: jcp.bruto.subtrair(retido),
  };
}
// #endregion

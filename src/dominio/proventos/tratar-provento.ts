import type { DadosDeReferencia } from '../dados-de-referencia.js';
import { Dinheiro } from '../dinheiro.js';
import { garantirExaustividade } from '../exaustividade.js';
import type { ErroSemRegime } from '../regime/regimes-tributarios.js';
import { ok, type Result } from '../resultado.js';
import { tratarJcp } from './jcp.js';
import type { Provento, TratamentoDoProvento } from './provento.js';

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
  switch (provento.tipo) {
    case 'dividendo':
      return ok(isento(provento));
    case 'jcp':
      return ok(tratarJcp(provento, regime.valor));
    default:
      return garantirExaustividade(provento);
  }
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

import {
  type Aliquota,
  arredondamentoDaRetencao,
} from '../aliquota.js';
import { Dinheiro } from '../dinheiro.js';
import type { Provento, TratamentoDoProvento } from './provento.js';

// #region tratamentos
// As formas que a lei dá ao provento. Isento: nada é retido. Exclusivo
// na fonte: a fonte retém pela alíquota, e o imposto acaba ali, sem
// ajuste na declaração.
export function isento(provento: Provento): TratamentoDoProvento {
  return {
    provento,
    tratamento: 'isento',
    retido: Dinheiro.deCentavos(0n),
    liquido: provento.bruto,
  };
}

export function exclusivoNaFonte(
  provento: Provento,
  aliquota: Aliquota,
): TratamentoDoProvento {
  const retido = aliquota.sobre(
    provento.bruto,
    arredondamentoDaRetencao,
  );
  return {
    provento,
    tratamento: 'exclusivo-na-fonte',
    retido,
    liquido: provento.bruto.subtrair(retido),
  };
}
// #endregion

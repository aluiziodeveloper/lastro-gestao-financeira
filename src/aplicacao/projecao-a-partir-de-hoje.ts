import { MesDeApuracao } from '../dominio/apuracao/mes-de-apuracao.js';
import type { Carteira } from '../dominio/carteira.js';
import { dataEmSaoPaulo } from '../dominio/data-do-calendario.js';
import {
  projetarRenda,
  type RendaProjetada,
} from '../dominio/projecao/renda-projetada.js';
import type { Provento } from '../dominio/proventos/provento.js';
import type { Relogio } from '../dominio/relogio.js';

// #region caso-de-uso
// A casca do núcleo funcional: lê o relógio uma vez, converte o
// instante no mês corrente de São Paulo e entrega o mês ao núcleo,
// que é puro. O que muda de uma execução para outra entra por aqui, e
// só por aqui.
export function projecaoAPartirDeHoje(
  relogio: Relogio,
  proventos: readonly Provento[],
  carteira: Carteira,
): RendaProjetada {
  const hoje = dataEmSaoPaulo(relogio.agora());
  return projetarRenda(proventos, carteira, MesDeApuracao.doDia(hoje));
}
// #endregion

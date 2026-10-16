import type { CatalogoDeAtivos } from '../../src/dominio/ativo.js';
import { MesDeApuracao } from '../../src/dominio/apuracao/mes-de-apuracao.js';
import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import type { DadosDeReferencia } from '../../src/dominio/dados-de-referencia.js';
import type { RegrasDeApuracao } from '../../src/dominio/regime/regime-tributario.js';
import { definicoesDoLastro } from '../../src/dominio/regime/regimes.js';
import { RegimesTributarios } from '../../src/dominio/regime/regimes-tributarios.js';
import { extrair } from '../apoio/resultado.js';

// #region referencias-de-teste
// O mês e a lei entram em todo teste de apuração como dados fixos: o
// teste diz qual mês apura, e nunca depende do dia em que roda.
export const regimesDoLastro = extrair(
  RegimesTributarios.criar(definicoesDoLastro),
);

export function mes(texto: string): MesDeApuracao {
  return extrair(MesDeApuracao.criar(texto));
}

export function referenciasCom(
  catalogo: CatalogoDeAtivos,
): DadosDeReferencia {
  return { catalogo, regimes: regimesDoLastro };
}
// #endregion

export function regrasEm(texto: string): RegrasDeApuracao {
  const data = extrair(criarDataDoCalendario(texto));
  return extrair(regimesDoLastro.vigenteEm(data)).apuracao;
}

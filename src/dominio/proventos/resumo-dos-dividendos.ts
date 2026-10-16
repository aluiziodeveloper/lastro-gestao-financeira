import { MesDeApuracao } from '../apuracao/mes-de-apuracao.js';
import type { DadosDeReferencia } from '../dados-de-referencia.js';
import { Dinheiro } from '../dinheiro.js';
import { ok, type Result } from '../resultado.js';
import {
  type RetencaoDaEmpresa,
  retencaoDeDividendos,
} from './dividendos.js';
import type { Dividendo } from './provento.js';
import type { ErroDeProvento } from './tratar-provento.js';

// Os dividendos de um ano: os isentos, os que tiveram a retenção da
// Lei 15.270/2025 e o que a fonte reteve sobre eles.
export interface DividendosDoAno {
  readonly isentos: Dinheiro;
  readonly antecipados: Dinheiro;
  readonly retido: Dinheiro;
}

// #region resumo-dos-dividendos
// Em cada mês com dividendos, as empresas que passaram do limite vão
// inteiras para a antecipação; o resto dos dividendos é isento.
export function dividendosDoAno(
  dividendos: readonly Dividendo[],
  referencias: DadosDeReferencia,
): Result<DividendosDoAno, ErroDeProvento> {
  const retencoes = retencoesDosMeses(dividendos, referencias);
  if (!retencoes.ok) {
    return retencoes;
  }
  const antecipados = somaDe(retencoes.valor.map(({ total }) => total));
  const brutos = somaDe(dividendos.map(({ bruto }) => bruto));
  return ok({
    isentos: brutos.subtrair(antecipados),
    antecipados,
    retido: somaDe(retencoes.valor.map(({ retido }) => retido)),
  });
}
// #endregion

function retencoesDosMeses(
  dividendos: readonly Dividendo[],
  referencias: DadosDeReferencia,
): Result<readonly RetencaoDaEmpresa[], ErroDeProvento> {
  const meses = new Map(
    dividendos.map(({ pagamento }) => [
      pagamento.slice(0, 7),
      MesDeApuracao.de(pagamento),
    ]),
  );
  return [...meses.values()].reduce<
    Result<readonly RetencaoDaEmpresa[], ErroDeProvento>
  >((anteriores, mes) => {
    if (!anteriores.ok) {
      return anteriores;
    }
    const doMes = retencaoDeDividendos(mes, dividendos, referencias);
    return doMes.ok
      ? ok([...anteriores.valor, ...doMes.valor.filter(comRetencao)])
      : doMes;
  }, ok([]));
}

function comRetencao({ retido }: RetencaoDaEmpresa): boolean {
  return retido.ehPositivo();
}

function somaDe(valores: readonly Dinheiro[]): Dinheiro {
  return valores.reduce(
    (soma, valor) => soma.somar(valor),
    Dinheiro.deCentavos(0n),
  );
}

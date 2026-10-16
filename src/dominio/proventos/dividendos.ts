import type { MesDeApuracao } from '../apuracao/mes-de-apuracao.js';
import type { CatalogoDeAtivos, ErroDeCatalogo } from '../ativo.js';
import type { DadosDeReferencia } from '../dados-de-referencia.js';
import { Dinheiro } from '../dinheiro.js';
import type { Emissor } from '../emissor.js';
import type { RegraDeDividendos } from '../regime/regime-tributario.js';
import { ok, type Result } from '../resultado.js';
import type { Dividendo, Provento } from './provento.js';
import type { ErroDeProvento } from './tratar-provento.js';

// O total de dividendos que uma empresa pagou no mês e o que a fonte
// retém sobre ele.
export interface RetencaoDaEmpresa {
  readonly emissor: Emissor;
  readonly total: Dinheiro;
  readonly retido: Dinheiro;
}

const zero = Dinheiro.deCentavos(0n);

// #region dividendos-retencao
// Por empresa e por mês, e não por pagamento nem por ticker: PETR3 e
// PETR4 somam. Passou do limite, a fonte retém sobre o total, e não
// só sobre o que excede. Os dividendos da transição ficam fora.
export function retencaoDeDividendos(
  mes: MesDeApuracao,
  proventos: readonly Provento[],
  referencias: DadosDeReferencia,
): Result<readonly RetencaoDaEmpresa[], ErroDeProvento> {
  const regime = referencias.regimes.vigenteEm(mes.primeiroDia());
  if (!regime.ok) {
    return regime;
  }
  const regra = regime.valor.proventos.dividendos;
  if (regra === undefined) {
    return ok([]);
  }
  const somas = somarPorEmpresa(
    queEntramNaSoma(mes, proventos, regra),
    referencias.catalogo,
  );
  return somas.ok ? ok(retencoes(somas.valor, regra)) : somas;
}

function queEntramNaSoma(
  mes: MesDeApuracao,
  proventos: readonly Provento[],
  regra: RegraDeDividendos,
): readonly Dividendo[] {
  return proventos
    .filter((provento) => provento.tipo === 'dividendo')
    .filter(({ pagamento }) => mes.contem(pagamento))
    .filter((dividendo) => !daTransicao(dividendo, regra));
}

function retencoes(
  somas: ReadonlyMap<Emissor, Dinheiro>,
  { limiteMensal, aliquota }: RegraDeDividendos,
): readonly RetencaoDaEmpresa[] {
  return [...somas].map(([emissor, total]) => ({
    emissor,
    total,
    retido: total.excede(limiteMensal) ? aliquota.sobre(total) : zero,
  }));
}
// #endregion

// #region dividendos-transicao
// Lucro apurado até o último ano da transição, com a distribuição
// aprovada até o fim desse ano. Que o pagamento siga o ato de
// aprovação, a terceira condição da lei, o Lastro supõe.
function daTransicao(
  { anoDoLucro, aprovacao }: Dividendo,
  { ultimoAnoDaTransicao }: RegraDeDividendos,
): boolean {
  const anoDaAprovacao = Number(aprovacao.slice(0, 4));
  return (
    anoDoLucro <= ultimoAnoDaTransicao &&
    anoDaAprovacao <= ultimoAnoDaTransicao
  );
}
// #endregion

function somarPorEmpresa(
  dividendos: readonly Dividendo[],
  catalogo: CatalogoDeAtivos,
): Result<ReadonlyMap<Emissor, Dinheiro>, ErroDeCatalogo> {
  return dividendos.reduce<
    Result<ReadonlyMap<Emissor, Dinheiro>, ErroDeCatalogo>
  >((somas, dividendo) => {
    if (!somas.ok) {
      return somas;
    }
    const emissor = catalogo.emissorDe(dividendo.ticker);
    if (!emissor.ok) {
      return emissor;
    }
    const anterior = somas.valor.get(emissor.valor) ?? zero;
    const soma = anterior.somar(dividendo.bruto);
    return ok(new Map(somas.valor).set(emissor.valor, soma));
  }, ok(new Map()));
}

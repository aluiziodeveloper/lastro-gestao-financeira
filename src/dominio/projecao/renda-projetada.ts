import type { MesDeApuracao } from '../apuracao/mes-de-apuracao.js';
import type { ModoDeArredondamento } from '../arredondamento.js';
import type { Carteira } from '../carteira.js';
import { Dinheiro } from '../dinheiro.js';
import { type Provento, unidadesDe } from '../proventos/provento.js';
import type { Ticker } from '../ticker.js';

// #region projecao-renda
// Projetar não é prever: a renda dos próximos doze meses repete a dos
// doze meses fechados, com a posição de hoje. A janela vai do mesmo
// mês do ano anterior até o mês passado; o mês corrente fica de fora,
// porque ainda não fechou. Cada provento da janela volta no mesmo mês
// do ano, escalado pelas unidades de hoje sobre as que o receberam. A
// projeção é bruta: o imposto dos dividendos depende do total pago no
// mês, e projetá-lo seria outra projeção.
const arredondamentoDaProjecao: ModoDeArredondamento = 'meio-para-cima';

export interface ProventoProjetado {
  readonly origem: Provento;
  readonly valor: Dinheiro;
}

export interface MesProjetado {
  readonly mes: MesDeApuracao;
  readonly proventos: readonly ProventoProjetado[];
  readonly total: Dinheiro;
}

export interface RendaProjetada {
  readonly meses: readonly MesProjetado[];
  readonly total: Dinheiro;
}

export function projetarRenda(
  proventos: readonly Provento[],
  carteira: Carteira,
  mesCorrente: MesDeApuracao,
): RendaProjetada {
  const janela = dozeMesesDepoisDe(mesCorrente.deslocado(-13));
  const daJanela = proventos.filter((provento) =>
    janela.some((mes) => mes.contem(provento.pagamento)),
  );
  const meses = dozeMesesDepoisDe(mesCorrente).map((mes) => {
    const projetados = daJanela
      .filter((provento) => mes.mesmoMesDoAno(provento.pagamento))
      .map((provento) => projetar(provento, carteira));
    const total = somar(projetados.map(({ valor }) => valor));
    return { mes, proventos: projetados, total };
  });
  return { meses, total: somar(meses.map(({ total }) => total)) };
}

function dozeMesesDepoisDe(
  mes: MesDeApuracao,
): readonly MesDeApuracao[] {
  return Array.from({ length: 12 }, (_, indice) =>
    mes.deslocado(indice + 1),
  );
}

// O rendimento de 100 cotas, para quem tem 150, vale 150/100 do que
// foi pago. Quem vendeu tudo tem zero unidades e projeta zero.
function projetar(
  provento: Provento,
  carteira: Carteira,
): ProventoProjetado {
  const valor = provento.bruto.multiplicarPorFracao(
    carteira.quantidadeDe(provento.ticker),
    unidadesDe(provento).paraBigInt(),
    arredondamentoDaProjecao,
  );
  return { origem: provento, valor };
}
// #endregion

// #region renda-dos-ativos
// A renda projetada de alguns ativos, somada nos doze meses.
export function rendaDos(
  renda: RendaProjetada,
  ativos: readonly Ticker[],
): Dinheiro {
  return somar(
    renda.meses
      .flatMap(({ proventos }) => proventos)
      .filter(({ origem }) =>
        ativos.some((ativo) => ativo.equivaleA(origem.ticker)),
      )
      .map(({ valor }) => valor),
  );
}
// #endregion

const zero = Dinheiro.deCentavos(0n);

function somar(valores: readonly Dinheiro[]): Dinheiro {
  return valores.reduce((total, valor) => total.somar(valor), zero);
}

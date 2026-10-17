import type { RepositorioDeCarteiras } from '../../aplicacao/portas.js';
import { posicaoDaCarteira } from '../../aplicacao/posicao-da-carteira.js';
import { relatorioDoMesDaCarteira } from '../../aplicacao/relatorio-da-carteira.js';
import { MesDeApuracao } from '../../dominio/apuracao/mes-de-apuracao.js';
import type { DadosDeReferencia } from '../../dominio/dados-de-referencia.js';
import { criarIdDeCarteira } from '../../dominio/id-de-carteira.js';
import { respostaDoErro } from './erros.js';
import { entradaInvalida, type Resposta } from './resposta.js';
import { dinheiroEmJson } from './serializacao.js';

interface Fontes {
  readonly repositorio: RepositorioDeCarteiras;
  readonly referencias: DadosDeReferencia;
}

// O relatório do mês, linha a linha, como o Capítulo 13 o escreve.
export async function relatorio(
  { repositorio, referencias }: Fontes,
  params: { readonly id: string; readonly mes: string },
): Promise<Resposta> {
  const id = criarIdDeCarteira(params.id);
  const mes = MesDeApuracao.criar(params.mes);
  if (!id.ok || !mes.ok) {
    return entradaInvalida;
  }
  const linhas = await relatorioDoMesDaCarteira(
    repositorio,
    referencias,
    id.valor,
    mes.valor,
  );
  return linhas.ok
    ? { status: 200, corpo: { linhas: linhas.valor } }
    : respostaDoErro(linhas.erro);
}

// #region posicao-em-json
// A posição de cada ativo: a quantidade e o custo vão como texto, e o
// custo também em reais (serializacao.ts).
export async function posicao(
  repositorio: RepositorioDeCarteiras,
  texto: string,
): Promise<Resposta> {
  const id = criarIdDeCarteira(texto);
  if (!id.ok) {
    return entradaInvalida;
  }
  const carteira = await posicaoDaCarteira(repositorio, id.valor);
  if (!carteira.ok) {
    return respostaDoErro(carteira.erro);
  }
  const ativos = carteira.valor.ativos().map((ticker) => ({
    ticker: ticker.paraTexto(),
    quantidade: String(carteira.valor.quantidadeDe(ticker)),
    custoTotal: dinheiroEmJson(carteira.valor.custoTotalDe(ticker)),
  }));
  return { status: 200, corpo: { ativos } };
}
// #endregion

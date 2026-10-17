import { basename } from 'node:path';

import type { RepositorioDeCarteiras } from '../../aplicacao/portas.js';
import { posicaoDaCarteira } from '../../aplicacao/posicao-da-carteira.js';
import { registrarOperacoes } from '../../aplicacao/registrar-operacoes.js';
import { relatorioDoMesDaCarteira } from '../../aplicacao/relatorio-da-carteira.js';
import { MesDeApuracao } from '../../dominio/apuracao/mes-de-apuracao.js';
import type { DadosDeReferencia } from '../../dominio/dados-de-referencia.js';
import type { IdDeCarteira } from '../../dominio/id-de-carteira.js';
import { err, ok, type Result } from '../../dominio/resultado.js';
import { importarCsv } from '../csv/importador.js';

// Cada comando devolve as linhas a escrever, ou a mensagem da recusa.
export type Linhas = Result<readonly string[], string>;

export async function importar(
  repositorio: RepositorioDeCarteiras,
  id: IdDeCarteira,
  caminho: string,
  texto: string,
): Promise<Linhas> {
  const operacoes = importarCsv(texto, basename(caminho));
  if (!operacoes.ok) {
    const { linha, campo } = operacoes.erro;
    return err(
      `Linha ${String(linha)}, campo ${campo}: valor inválido.`,
    );
  }
  const registro = await registrarOperacoes(
    repositorio,
    id,
    operacoes.valor,
  );
  const quantas = String(operacoes.valor.length);
  return registro.ok
    ? ok([`${quantas} operações registradas na carteira ${id}.`])
    : err(`Recusado: ${registro.erro.tipo}.`);
}

export async function relatorio(
  repositorio: RepositorioDeCarteiras,
  referencias: DadosDeReferencia,
  id: IdDeCarteira,
  texto: string,
): Promise<Linhas> {
  const mes = MesDeApuracao.criar(texto);
  if (!mes.ok) {
    return err(`Mês inválido: ${texto}. Use AAAA-MM.`);
  }
  const linhas = await relatorioDoMesDaCarteira(
    repositorio,
    referencias,
    id,
    mes.valor,
  );
  return linhas.ok ? linhas : err(`Recusado: ${linhas.erro.tipo}.`);
}

// #region exportar
// A posição em CSV, no formato do extrato: o cabeçalho e uma linha por
// ativo, na ordem em que entrou na carteira, com o custo em reais sem
// o símbolo. Uma carteira que o histórico não reconstitui é recusada.
export async function exportar(
  repositorio: RepositorioDeCarteiras,
  id: IdDeCarteira,
): Promise<Linhas> {
  const carteira = await posicaoDaCarteira(repositorio, id);
  if (!carteira.ok) {
    return err(`Recusado: ${carteira.erro.tipo}.`);
  }
  const linhas = carteira.valor
    .ativos()
    .map((ticker) =>
      [
        ticker.paraTexto(),
        String(carteira.valor.quantidadeDe(ticker)),
        carteira.valor
          .custoTotalDe(ticker)
          .emReais()
          .replace('R$ ', ''),
      ].join(';'),
    );
  return ok(['Ativo;Quantidade;Custo total', ...linhas]);
}
// #endregion

import { basename } from 'node:path';

import type { RepositorioDeCarteiras } from '../../aplicacao/portas.js';
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
// Desafio do Capítulo 15: a posição em CSV, no formato do extrato:
// o cabeçalho Ativo;Quantidade;Custo total e uma linha por ativo, com
// o custo em reais sem o símbolo. Os testes estão em
// test/adaptadores/cli/exportar.test.ts.
export function exportar(
  repositorio: RepositorioDeCarteiras,
  id: IdDeCarteira,
): Promise<Linhas> {
  throw new Error(`Desafio do Capítulo 15: exporte ${id}.`);
}
// #endregion

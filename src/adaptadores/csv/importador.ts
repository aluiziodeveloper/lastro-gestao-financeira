import { criarDataDePregao } from '../../dominio/data-de-pregao.js';
import { criarIdDeOperacao } from '../../dominio/id-de-operacao.js';
import {
  type CamposDaOperacao,
  criarCompra,
  criarVenda,
  type Operacao,
} from '../../dominio/operacao.js';
import { Quantidade } from '../../dominio/quantidade.js';
import { err, ok, type Result } from '../../dominio/resultado.js';
import { Ticker } from '../../dominio/ticker.js';
import {
  centavos,
  dataIso,
  inteiro,
  pelaData,
  primeiroInvalido,
} from './formatos.js';

// #region importador-csv
// O extrato da corretora fala a língua dela: datas dd/mm/aaaa, C ou V,
// valores com vírgula decimal e ponto de milhar. O importador traduz
// cada linha para uma Operacao do Lastro, e nada do formato de fora
// entra no domínio: é a camada anticorrupção.
export const cabecalho = 'Data;C/V;Ativo;Quantidade;Preço;Custos';

export interface ErroDeImportacao {
  readonly tipo: 'linha-invalida';
  readonly linha: number;
  readonly campo: string;
}

// As operações do arquivo, na ordem das datas de pregão. A ordenação é
// estável: duas operações do mesmo dia ficam na ordem do arquivo.
export function importarCsv(
  texto: string,
  origem: string,
): Result<readonly Operacao[], ErroDeImportacao> {
  const [primeira, ...linhas] = texto.split(/\r?\n/);
  if (primeira !== cabecalho) {
    return err({
      tipo: 'linha-invalida',
      linha: 1,
      campo: 'cabeçalho',
    });
  }
  const lidas = lerLinhas(linhas, origem);
  const falha = lidas.find(({ operacao }) => !operacao.ok);
  if (falha !== undefined && !falha.operacao.ok) {
    return err({ ...falha.operacao.erro, linha: falha.numero });
  }
  const operacoes = lidas.flatMap(({ operacao }) =>
    operacao.ok ? [operacao.valor] : [],
  );
  return ok(operacoes.toSorted(pelaData));
}
// #endregion

type ErroDaLinha = Omit<ErroDeImportacao, 'linha'>;

// Cada linha com o seu número no arquivo, contado a partir de 1 e com
// o cabeçalho; as linhas em branco ficam de fora.
function lerLinhas(linhas: readonly string[], origem: string) {
  return linhas
    .map((linha, indice) => ({ linha, numero: indice + 2 }))
    .filter(({ linha }) => linha.trim() !== '')
    .map(({ linha, numero }) => ({
      numero,
      operacao: operacaoDaLinha(linha, `${origem}:${String(numero)}`),
    }));
}

function invalida(campo: string): Result<never, ErroDaLinha> {
  return err({ tipo: 'linha-invalida', campo });
}

function operacaoDaLinha(
  linha: string,
  texto: string,
): Result<Operacao, ErroDaLinha> {
  const [data = '', tipo = '', ...resto] = linha.split(';');
  const id = criarIdDeOperacao(texto);
  if (!id.ok || (tipo !== 'C' && tipo !== 'V')) {
    return invalida('C/V');
  }
  const campos = camposDa(data, resto);
  if (!campos.ok) {
    return campos;
  }
  const completos = { ...campos.valor, id: id.valor };
  const operacao =
    tipo === 'C' ? criarCompra(completos) : criarVenda(completos);
  return operacao.ok ? operacao : invalida(operacao.erro.tipo);
}

// Os cinco campos valem juntos; se algum falha, o erro diz o primeiro.
function camposDa(
  data: string,
  [ativo = '', quantidade = '', preco = '', custos = '']: string[],
): Result<Omit<CamposDaOperacao, 'id'>, ErroDaLinha> {
  const campos = {
    data: criarDataDePregao(dataIso(data)),
    ticker: Ticker.criar(ativo),
    quantidade: Quantidade.criar(inteiro(quantidade)),
    precoUnitario: centavos(preco),
    custos: centavos(custos),
  };
  const { data: dia, ticker, quantidade: unidades } = campos;
  const { precoUnitario: valor, custos: custo } = campos;
  if (dia.ok && ticker.ok && unidades.ok && valor.ok && custo.ok) {
    const valores = { data: dia.valor, ticker: ticker.valor };
    const numeros = { quantidade: unidades.valor, custos: custo.valor };
    return ok({ ...valores, ...numeros, precoUnitario: valor.valor });
  }
  return invalida(primeiroInvalido(campos));
}

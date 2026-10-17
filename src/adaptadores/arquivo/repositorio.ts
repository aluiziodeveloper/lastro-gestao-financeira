import { readFile, writeFile } from 'node:fs/promises';

import type { RepositorioDeCarteiras } from '../../aplicacao/portas.js';
import type { Operacao } from '../../dominio/operacao.js';
import {
  type LinhaDeOperacao,
  operacaoDa,
  valoresDa,
} from '../sql/mapeamento.js';

// Cada operação no arquivo: os campos da linha do banco, todos em
// texto, porque o JSON não tem bigint.
type Gravada = { readonly [Campo in keyof LinhaDeOperacao]: string };
type Conteudo = Readonly<Record<string, readonly Gravada[]>>;

const campos = [
  'id',
  'tipo',
  'data',
  'ticker',
  'quantidade',
  'precoEmCentavos',
  'custosEmCentavos',
] as const;

// #region repositorio-arquivo
// O repositório num arquivo JSON, um objeto com uma lista por carteira.
// Os centavos e a quantidade vão como texto e voltam como bigint; a
// operação volta pelos construtores do domínio, como no SQL.
export function repositorioEmArquivo(
  caminho: string,
): RepositorioDeCarteiras {
  return {
    operacoesDe: async (id) => {
      const conteudo = await ler(caminho);
      return (conteudo[id] ?? []).map(lida);
    },
    acrescentar: async (id, operacoes) => {
      const conteudo = await ler(caminho);
      const lista = [
        ...(conteudo[id] ?? []),
        ...operacoes.map(gravada),
      ];
      const novo = { ...conteudo, [id]: lista };
      await writeFile(caminho, JSON.stringify(novo, null, 2));
    },
  };
}
// #endregion

// O arquivo que ainda não existe é um repositório vazio; qualquer
// outro erro de leitura sobe.
async function ler(caminho: string): Promise<Conteudo> {
  try {
    return JSON.parse(await readFile(caminho, 'utf8')) as Conteudo;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw erro;
  }
}

function gravada(operacao: Operacao): Gravada {
  const valores = valoresDa(operacao).map(String);
  return Object.fromEntries(
    campos.map((campo, indice) => [campo, valores[indice] ?? '']),
  ) as Gravada;
}

function lida(linha: Gravada): Operacao {
  return operacaoDa({
    ...linha,
    quantidade: BigInt(linha.quantidade),
    precoEmCentavos: BigInt(linha.precoEmCentavos),
    custosEmCentavos: BigInt(linha.custosEmCentavos),
  });
}

import type { RepositorioDeCarteiras } from '../../aplicacao/portas.js';
import type { DadosDeReferencia } from '../../dominio/dados-de-referencia.js';
import {
  criarIdDeCarteira,
  type IdDeCarteira,
} from '../../dominio/id-de-carteira.js';
import type { Result } from '../../dominio/resultado.js';
import {
  exportar,
  importar,
  type Linhas,
  relatorio,
} from './comandos.js';
import { lerPedido, type Pedido, uso } from './pedido.js';

// O que a CLI usa do mundo de fora, entregue por quem a monta: o
// main.ts passa o SQLite e o disco; o teste, a memória e um texto.
export interface Ambiente {
  readonly abrir: (banco: string) => RepositorioDeCarteiras;
  readonly ler: (caminho: string) => Result<string, string>;
  readonly escrever: (linha: string) => void;
  readonly referencias: DadosDeReferencia;
}

// #region cli-comandos
// O código de saída diz ao terminal como foi: 0, feito; 1, o Lastro
// recusou; 2, o pedido não seguiu o uso.
export async function executar(
  argumentos: readonly string[],
  ambiente: Ambiente,
): Promise<number> {
  const pedido = lerPedido(argumentos);
  const id = criarIdDeCarteira(pedido.ok ? pedido.valor.carteira : '');
  if (!pedido.ok || !id.ok) {
    ambiente.escrever(uso);
    return 2;
  }
  const resultado = await rodar(pedido.valor, id.valor, ambiente);
  const linhas = resultado.ok ? resultado.valor : [resultado.erro];
  linhas.forEach((linha) => {
    ambiente.escrever(linha);
  });
  return resultado.ok ? 0 : 1;
}
// #endregion

async function rodar(
  { comando, alvo, banco }: Pedido,
  id: IdDeCarteira,
  { abrir, ler, referencias }: Ambiente,
): Promise<Linhas> {
  if (comando === 'relatorio') {
    return relatorio(abrir(banco), referencias, id, alvo);
  }
  if (comando === 'exportar') {
    return exportar(abrir(banco), id);
  }
  const texto = ler(alvo);
  return texto.ok
    ? importar(abrir(banco), id, alvo, texto.valor)
    : texto;
}

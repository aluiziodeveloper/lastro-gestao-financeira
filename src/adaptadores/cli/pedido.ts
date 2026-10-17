import { parseArgs } from 'node:util';

import { err, ok, type Result } from '../../dominio/resultado.js';

// #region pedido-da-cli
// O que a pessoa pediu na linha de comando. O parseArgs do Node separa
// as opções (--carteira x) dos argumentos soltos (o comando e o alvo);
// no modo estrito, uma opção desconhecida lança TypeError.
export interface Pedido {
  readonly comando: 'importar' | 'relatorio';
  readonly alvo: string;
  readonly carteira: string;
  readonly banco: string;
}

export const uso = `Uso:
  lastro importar <extrato.csv> --carteira <id> --banco <arquivo>
  lastro relatorio <AAAA-MM> --carteira <id> --banco <arquivo>`;

export function lerPedido(
  argumentos: readonly string[],
): Result<Pedido, 'uso'> {
  const lido = analisar(argumentos);
  if (!lido.ok) {
    return lido;
  }
  const { positionals, values } = lido.valor;
  const [comando, alvo, ...sobra] = positionals;
  const { carteira, banco } = values;
  const conhecido = comando === 'importar' || comando === 'relatorio';
  if (!conhecido || alvo === undefined || sobra.length > 0) {
    return err('uso');
  }
  return carteira !== undefined && banco !== undefined
    ? ok({ comando, alvo, carteira, banco })
    : err('uso');
}
// #endregion

function analisar(argumentos: readonly string[]) {
  try {
    return ok(
      parseArgs({
        args: [...argumentos],
        allowPositionals: true,
        options: {
          carteira: { type: 'string' },
          banco: { type: 'string' },
        },
      }),
    );
  } catch {
    return err('uso' as const);
  }
}

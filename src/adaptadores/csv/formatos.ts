import { Dinheiro } from '../../dominio/dinheiro.js';
import { err, ok, type Result } from '../../dominio/resultado.js';

// #region formatos-da-corretora
// 15/04/2026 vira 2026-04-15; o construtor da data confere o resto.
export function dataIso(texto: string): string {
  const [dia = '', mes = '', ano = ''] = texto.split('/');
  return `${ano}-${mes}-${dia}`;
}

// 1.234,56 ou 1234,56 vira 123456 centavos; outro formato não é
// dinheiro.
export function centavos(texto: string): Result<Dinheiro, null> {
  if (!/^(\d{1,3}(\.\d{3})*|\d+),\d{2}$/.test(texto)) {
    return err(null);
  }
  const digitos = texto.replaceAll('.', '').replace(',', '');
  return ok(Dinheiro.deCentavos(BigInt(digitos)));
}

// 1.000 ou 1000 vira mil; Number('1.000') daria 1, porque lê o ponto
// como separador decimal. O que não for inteiro vira NaN, e a
// Quantidade o recusa.
export function inteiro(texto: string): number {
  return /^(\d{1,3}(\.\d{3})*|\d+)$/.test(texto)
    ? Number(texto.replaceAll('.', ''))
    : Number.NaN;
}

// O nome do primeiro campo que não passou, para a mensagem de erro.
export function primeiroInvalido(
  campos: Record<string, Result<unknown, unknown>>,
): string {
  const [campo = 'linha'] =
    Object.entries(campos).find(([, resultado]) => !resultado.ok) ?? [];
  return campo;
}

// Comparador sem ramo, como no Capítulo 12: as datas ISO comparam como
// texto.
export function pelaData(
  uma: { readonly data: string },
  outra: { readonly data: string },
): number {
  return Number(uma.data > outra.data) - Number(uma.data < outra.data);
}
// #endregion

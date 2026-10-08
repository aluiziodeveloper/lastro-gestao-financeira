// Testes de tipos: quem os verifica é o compilador (npm run typecheck),
// não o Vitest. Em execução, expectTypeOf não faz nada.
import { describe, expectTypeOf, it } from 'vitest';

import type { DataDePregao } from '../../src/dominio/data-de-pregao.js';
import type { ErroDeOperacao } from '../../src/dominio/erros.js';
import type { IdDeOperacao } from '../../src/dominio/id-de-operacao.js';
import {
  type CamposDaOperacao,
  type Compra,
  criarCompra,
  type Operacao,
} from '../../src/dominio/operacao.js';
import type { Result } from '../../src/dominio/resultado.js';

// #region operacao-testes-de-tipos
describe('tipos da operação', () => {
  it('não confunde identificador com data', () => {
    expectTypeOf<DataDePregao>().not.toEqualTypeOf<IdDeOperacao>();
    expectTypeOf<string>().not.toExtend<IdDeOperacao>();
  });

  it('só cria compra pelo construtor', () => {
    expectTypeOf(criarCompra).returns.toEqualTypeOf<
      Result<Compra, ErroDeOperacao>
    >();
    const campos = {} as CamposDaOperacao;
    // @ts-expect-error -- literal sem a marca da operação validada
    const literal: Compra = { ...campos, tipo: 'compra' };
    expectTypeOf(literal).toEqualTypeOf<Compra>();
  });

  it('estreita a operação pelo campo tipo', () => {
    const operacao = {} as Operacao;
    if (operacao.tipo === 'compra') {
      expectTypeOf(operacao).toEqualTypeOf<Compra>();
    }
  });
});
// #endregion

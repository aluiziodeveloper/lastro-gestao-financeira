import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { operacoes } from './geradores.js';

// #region geradores-teste
// Um gerador errado esvazia as propriedades sem que nenhuma falhe: com
// datas fora de ordem, a carteira recusaria quase tudo.
describe('geradores', () => {
  it('produz operações em ordem cronológica', () => {
    fc.assert(
      fc.property(operacoes, (sequencia) => {
        const datas = sequencia.map((operacao) => operacao.data);
        expect(datas).toEqual([...datas].sort());
      }),
    );
  });

  it('usa no máximo três ativos', () => {
    fc.assert(
      fc.property(operacoes, (sequencia) => {
        const ativos = new Set(
          sequencia.map((operacao) => operacao.ticker.paraTexto()),
        );
        expect(ativos.size).toBeLessThanOrEqual(3);
      }),
    );
  });
});
// #endregion

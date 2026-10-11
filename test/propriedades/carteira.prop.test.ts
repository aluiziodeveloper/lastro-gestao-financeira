import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { Carteira } from '../../src/dominio/carteira.js';
import { criarIdDeCarteira } from '../../src/dominio/id-de-carteira.js';
import { extrair } from '../apoio/resultado.js';
import { operacoes } from './geradores.js';

describe('R2 · propriedades da carteira', () => {
  // #region prop-nunca-negativa
  // O modelo de referência é um mapa de quantidades por ativo, simples
  // o bastante para ser conferido de cabeça. A carteira deve aceitar e
  // recusar o que ele aceita e recusa, e ter as mesmas quantidades.
  it('acompanha o modelo de quantidades e nunca fica negativa', () => {
    fc.assert(
      fc.property(operacoes, (sequencia) => {
        let carteira = Carteira.abrir(
          extrair(criarIdDeCarteira('c-1')),
        );
        const modelo = new Map<string, bigint>();
        for (const operacao of sequencia) {
          const ativo = operacao.ticker.paraTexto();
          const antes = modelo.get(ativo) ?? 0n;
          const quantidade = operacao.quantidade.paraBigInt();
          const depois =
            operacao.tipo === 'compra'
              ? antes + quantidade
              : antes - quantidade;
          const registro = carteira.registrar(operacao);
          expect(registro.ok).toBe(depois >= 0n);
          if (registro.ok) {
            carteira = registro.valor;
            modelo.set(ativo, depois);
          }
          expect(carteira.quantidadeDe(operacao.ticker)).toBe(
            modelo.get(ativo) ?? 0n,
          );
        }
      }),
    );
  });
  // #endregion
});

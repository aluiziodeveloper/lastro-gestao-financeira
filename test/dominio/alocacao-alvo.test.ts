import { describe, expect, it } from 'vitest';

import {
  AlocacaoAlvo,
  type Fatia,
  limitesDe,
} from '../../src/dominio/alocacao/alocacao-alvo.js';
import type { ClasseDeAtivo } from '../../src/dominio/ativo.js';
import { pontosBase } from '../../src/dominio/mercado/pontos-base.js';
import { err } from '../../src/dominio/resultado.js';
import { extrair } from '../apoio/resultado.js';

function fatia(
  classe: ClasseDeAtivo,
  alvo: bigint,
  banda: bigint,
): Fatia {
  return { classe, alvo: pontosBase(alvo), banda: pontosBase(banda) };
}

// #region alocacao-alvo-teste
describe('Alocação-alvo', () => {
  const metadeEmCada = [
    fatia('acao', 5_000n, 500n),
    fatia('fii', 5_000n, 500n),
  ];

  it('aceita alvos que somam 100%, com a banda de cada classe', () => {
    const alocacao = extrair(AlocacaoAlvo.criar(metadeEmCada));

    expect(alocacao.fatiaDe('acao')).toEqual(
      fatia('acao', 5_000n, 500n),
    );
    expect(limitesDe(alocacao.fatiaDe('fii'))).toEqual({
      minimo: 4_500n,
      maximo: 5_500n,
    });
  });

  it.each([
    [9_999n, 'um ponto-base a menos'],
    [10_001n, 'um ponto-base a mais'],
  ])('recusa alvos que somam %i (%s)', (soma) => {
    const fatias = [
      fatia('acao', 5_000n, 0n),
      fatia('fii', soma - 5_000n, 0n),
    ];

    expect(AlocacaoAlvo.criar(fatias)).toEqual(
      err({ tipo: 'alvos-nao-somam-cem', soma }),
    );
  });

  it.each([
    [fatia('fii', 5_000n, -1n), 'banda negativa'],
    [fatia('fii', 5_000n, 5_001n), 'banda maior que o alvo'],
    [fatia('fii', -1n, 0n), 'alvo negativo'],
  ])('recusa a fatia com %s', (invalida) => {
    expect(
      AlocacaoAlvo.criar([fatia('acao', 5_000n, 500n), invalida]),
    ).toEqual(err({ tipo: 'fatia-invalida', classe: 'fii' }));
  });

  it('aceita a banda igual ao alvo, que vai de zero ao dobro', () => {
    const fatias = [
      fatia('acao', 5_000n, 5_000n),
      fatia('fii', 5_000n, 0n),
    ];

    expect(AlocacaoAlvo.criar(fatias).ok).toBe(true);
  });

  it('recusa a mesma classe duas vezes', () => {
    const fatias = [fatia('fii', 5_000n, 0n), fatia('fii', 5_000n, 0n)];

    expect(AlocacaoAlvo.criar(fatias)).toEqual(
      err({ tipo: 'classe-repetida', classe: 'fii' }),
    );
  });

  it('dá alvo e banda zero à classe sem fatia', () => {
    const alocacao = extrair(AlocacaoAlvo.criar(metadeEmCada));

    expect(alocacao.fatiaDe('etf')).toEqual(fatia('etf', 0n, 0n));
  });
});
// #endregion

describe('Alocação-alvo como objeto de valor', () => {
  const metadeEmCada = extrair(
    AlocacaoAlvo.criar([
      fatia('acao', 5_000n, 500n),
      fatia('fii', 5_000n, 500n),
    ]),
  );

  it('equivale à mesma alocação em outra ordem', () => {
    const invertida = extrair(
      AlocacaoAlvo.criar([
        fatia('fii', 5_000n, 500n),
        fatia('acao', 5_000n, 500n),
      ]),
    );

    expect(metadeEmCada).toEqual(invertida);
  });

  it.each([
    [[fatia('acao', 6_000n, 500n), fatia('fii', 4_000n, 500n)], 'alvo'],
    [
      [fatia('acao', 5_000n, 400n), fatia('fii', 5_000n, 500n)],
      'banda',
    ],
    [
      [
        fatia('acao', 5_000n, 500n),
        fatia('fii', 5_000n, 500n),
        fatia('etf', 0n, 0n),
      ],
      'número de fatias',
    ],
  ])('não equivale com outro %s', (fatias) => {
    const outra = extrair(AlocacaoAlvo.criar(fatias));

    expect(metadeEmCada.equivaleA(outra)).toBe(false);
  });

  it('mostra as fatias na mensagem de falha', () => {
    expect(() => {
      expect(metadeEmCada).toEqual(
        extrair(
          AlocacaoAlvo.criar([
            fatia('acao', 6_000n, 500n),
            fatia('fii', 4_000n, 500n),
          ]),
        ),
      );
    }).toThrow('AlocacaoAlvo(acao 5000±500, fii 5000±500)');
  });
});

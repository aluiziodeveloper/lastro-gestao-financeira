import { describe, it } from 'vitest';

// A lista de testes da extensão de ativos no exterior.
describe('Extensão: ativos no exterior', () => {
  it.todo(
    'registra a operação na moeda estrangeira e a taxa de câmbio',
  );
  it.todo('converte o custo pela taxa da data de cada operação');
  it.todo('lê o câmbio por uma porta, como o relógio do Capítulo 12');
  it.todo('apura o ganho por ano, e não por mês');
  it.todo('compensa o imposto pago no exterior, com fonte conferida');
});

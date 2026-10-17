import { describe, it } from 'vitest';

// A lista de testes da extensão de opções.
describe('Extensão: opções', () => {
  it.todo(
    'cria uma opção com ativo-objeto, preço de exercício e série',
  );
  it.todo('aceita posição vendida, com quantidade negativa');
  it.todo('encerra a posição no vencimento, sem exercício');
  it.todo('converte o exercício numa compra ou venda do ativo-objeto');
  it.todo('soma o prêmio ao custo do ativo recebido no exercício');
  it.todo(
    'apura as opções numa categoria própria, com fonte conferida',
  );
});

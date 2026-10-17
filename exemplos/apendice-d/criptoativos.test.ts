import { describe, it } from 'vitest';

// A lista de testes da extensão de criptoativos.
describe('Extensão: criptoativos', () => {
  it.todo('aceita quantidade fracionária, com casas decimais fixas');
  it.todo('mantém o preço médio sem perda nas frações');
  it.todo('separa a custódia em corretora brasileira e no exterior');
  it.todo('apura num contexto delimitado à parte da bolsa');
  it.todo('aplica a isenção própria, com o limite conferido na fonte');
});

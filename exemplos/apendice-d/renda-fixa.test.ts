import { describe, it } from 'vitest';

// #region renda-fixa
// A lista de testes de uma extensão: renda fixa. Cada it.todo é um
// comportamento a especificar antes do código, como a especificação do
// Capítulo 1. As alíquotas e os prazos vêm da legislação vigente,
// conferida na fonte; nenhum número aqui é regra.
describe('Extensão: renda fixa', () => {
  it.todo('cria um título com emissor, vencimento e taxa contratada');
  it.todo('rende por dia útil, com o calendário do Capítulo 11');
  it.todo('escolhe a alíquota pelo prazo entre a compra e o resgate');
  it.todo('tributa só o rendimento, e não o valor aplicado');
  it.todo('registra o imposto retido no resgate, e não um DARF');
  it.todo('recusa resgate maior que a posição no título');
});
// #endregion

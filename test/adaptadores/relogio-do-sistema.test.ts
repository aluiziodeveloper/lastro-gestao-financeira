import { describe, expect, it } from 'vitest';

import { relogioDoSistema } from '../../src/adaptadores/relogio-do-sistema.js';

// O único teste que depende da hora em que roda: ele confere que o
// adaptador lê o relógio da máquina, e só pode fazer isso lendo-o
// também.
describe('relogioDoSistema', () => {
  it('devolve o instante da máquina', () => {
    const antes = Date.now();
    const agora = relogioDoSistema.agora().getTime();
    const depois = Date.now();

    expect(agora).toBeGreaterThanOrEqual(antes);
    expect(agora).toBeLessThanOrEqual(depois);
  });

  it('devolve um Date novo a cada chamada', () => {
    expect(relogioDoSistema.agora()).not.toBe(relogioDoSistema.agora());
  });
});

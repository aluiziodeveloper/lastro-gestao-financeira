import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/configuracao/igualdade-por-valor.ts'],
    // Objetos de valor compostos têm mensagens maiores que o corte
    // padrão de 40 caracteres, que as trocaria por { Object () }.
    chaiConfig: { truncateThreshold: 80 },
    // #region fuso-dos-testes
    // A suíte roda em UTC, como a máquina da CI, em qualquer
    // computador: um teste que só passasse no fuso de quem o escreveu
    // falharia na CI, e o contrário também.
    env: { TZ: 'UTC' },
    // #endregion
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'html'],
    },
  },
});

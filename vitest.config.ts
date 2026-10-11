import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/configuracao/igualdade-por-valor.ts'],
    // Objetos de valor compostos têm mensagens maiores que o corte
    // padrão de 40 caracteres, que as trocaria por { Object () }.
    chaiConfig: { truncateThreshold: 80 },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'html'],
    },
  },
});

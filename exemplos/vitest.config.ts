import { defineConfig } from 'vitest/config';

// Os testes de exemplo ficam fora da suíte do Lastro, que só lê test/,
// e rodam com esta configuração a partir da raiz do repositório:
// npx vitest run -c exemplos/vitest.config.ts
export default defineConfig({
  test: {
    include: ['exemplos/**/*.test.ts'],
    setupFiles: ['test/configuracao/igualdade-por-valor.ts'],
  },
});

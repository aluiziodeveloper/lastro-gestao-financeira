import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['coverage/', 'dist/', 'reports/'] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // #region calisthenics-nomes
  // Regra 6 de Calisthenics: nada de abreviações. Vale para src/ e
  // test/; exemplos/ guarda o código das cenas como ele era.
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    rules: {
      'id-denylist': [
        'error',
        'qtd',
        'qtde',
        'vlr',
        'val',
        'op',
        'pm',
        'cart',
        'tkr',
        'cod',
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],
    },
  },
  // #endregion
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
  // #region largura-dos-comentarios
  // O Prettier quebra o código em 72 colunas, mas não os comentários,
  // e as listagens do livro têm 72. Fica depois de `prettier`, que
  // desliga as regras de largura.
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/max-len': [
        'error',
        { code: 200, comments: 72, ignoreUrls: true },
      ],
    },
  },
  // #endregion
);

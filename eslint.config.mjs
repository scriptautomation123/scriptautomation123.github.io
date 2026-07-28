import eslintPluginAstro from 'eslint-plugin-astro';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist/', '.astro/', 'node_modules/'],
  },
  // Add recommended Astro rules
  ...eslintPluginAstro.configs.all,
  // Configure parsers for script tags and Astro files
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: eslintPluginAstro.parser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.astro'],
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.mts', '**/*.js', '**/*.mjs'],
    languageOptions: {
      parser: tsParser,
    },
  },
];

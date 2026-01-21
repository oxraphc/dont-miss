import js from '@eslint/js';
import globals from 'globals';
import css from '@eslint/css';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        plugins: {
            '@stylistic': stylistic
        }
    },
    stylistic.configs.recommended,
    {
        rules: {
            'eqeqeq': 'warn',
            'camelcase': ['error', { 'properties': 'always' }],
            'no-var': 'error',
            'prefer-const': 'error',
            '@stylistic/key-spacing': 'warn',
            '@stylistic/keyword-spacing': 'warn',
            '@stylistic/spaced-comment': ['warn', 'always', { 'block': { 'balanced': true } }],
            '@stylistic/switch-colon-spacing': ['warn', { 'after': true, 'before': false }],
            '@stylistic/indent': ['warn', 4],
            '@stylistic/quotes': ['warn', 'single', { 'allowTemplateLiterals': 'always' }],
            '@stylistic/semi': ['warn', 'always'],
            '@stylistic/comma-dangle': ['warn', 'never'],
            '@stylistic/quote-props': ['warn', 'consistent'],
            '@stylistic/brace-style': ['warn', '1tbs'],
            '@stylistic/no-multiple-empty-lines': ['warn', { 'max': 2 }],
            '@stylistic/eol-last': ['warn', 'never']
        }
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        plugins: { js },
        extends: ['js/recommended'],
        languageOptions: { globals: globals.browser }
    },
    {
        files: ['**/*.css'],
        plugins: { css },
        language: 'css/css',
        extends: ['css/recommended']
    }
]);
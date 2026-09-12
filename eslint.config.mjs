import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Hydration and localStorage synchronization intentionally initialize client state in effects.
      'react-hooks/set-state-in-effect': 'off',
      // Brand artwork is served locally and intentionally preserves native dimensions.
      '@next/next/no-img-element': 'off',
    },
  },
  globalIgnores([
    '.sources/**',
    '**/.next/**',
    '**/node_modules/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
]);

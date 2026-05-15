import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Flat ESLint config — minimal, opinionated. Catches what TS strict
 * doesn't: missing hook deps, unused vars, accidental `any`-shaped patterns,
 * and Fast Refresh boundary violations. We deliberately don't enable
 * stylistic rules (formatting) — let Prettier/editor handle that if added.
 */
export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', '.vercel', '.vite', '*.config.{js,ts}', 'scripts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Accept underscore-prefixed unused vars (deliberate ignore convention).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Project uses `as unknown as ...` casts at SDK boundaries — ban
      // raw `any` but allow these explicit double-casts.
      '@typescript-eslint/no-explicit-any': 'warn',
      // The on-chain field shapes are loose; we cast at boundaries.
      '@typescript-eslint/no-empty-object-type': 'off',

      // ─── React Hooks v7 (newly aggressive rules — relax with care) ──
      // `Date.now()` inside JSX is intentional and harmless (read-only,
      // re-evaluated each render which is what we want for "X min ago"
      // labels). Idempotency rule fires unhelpfully here.
      'react-hooks/purity': 'off',
      // We use the `accountRef = useRef(account); useEffect(() => { ref.current = account })`
      // pattern intentionally to mirror state into a ref for async closures.
      // Rule flags it as "cascading render" but the effect is read-only.
      'react-hooks/set-state-in-effect': 'off',
      // friendlyError rewraps caught errors with user-actionable messages —
      // by design we don't pass the raw cause through (would leak SDK
      // internals to the UI string).
      'preserve-caught-error': 'off',
      // SDK `as unknown as ...` boundary casts assign typed locals that
      // are then discarded once narrowed — acceptable in glue code.
      'no-useless-assignment': 'off',
    },
  },
);

import type { Options } from 'prettier';

/**
 * The prettier options every quidproquo repo formats with. The scaffolded app has no `.prettierrc`: its
 * `prettier.config.mjs` re-exports `@qpqjs/eslint-config/prettier`, which the app cannot resolve until its
 * dependencies are installed, so the scaffolder loads the same config from its own install.
 */
export const readSharedPrettierOptions = (): Options => {
  // Lazy so the config is only loaded by the step that formats; Node 24 requires an ESM module without a flag.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sharedPrettierConfig = require('@qpqjs/eslint-config/prettier') as { default: Options };

  return sharedPrettierConfig.default;
};

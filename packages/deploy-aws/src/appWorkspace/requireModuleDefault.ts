/**
 * `require`s a workspace module and hands back its default export, or the module itself when
 * it has none (a CommonJS `module.exports = ...`). Callers run under ts-node (or rspack's
 * config evaluation), which is what lets a `.ts` path load; a missing module throws.
 */
export const requireModuleDefault = <T>(modulePath: string): T => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loaded = require(modulePath);

  return (loaded.default ?? loaded) as T;
};

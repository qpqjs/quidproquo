import { RuleSetRule } from '@rspack/core';

/**
 * TypeScript through rspack's builtin swc loader, no type check. The same options as a
 * service build's rule, kept here so this package does not depend on deploy-rspack.
 */
export const userScriptTsRule = (): RuleSetRule => ({
  test: /\.ts$/,
  exclude: /node_modules/,
  loader: 'builtin:swc-loader',
  options: {
    jsc: {
      parser: { syntax: 'typescript', tsx: false, decorators: true },
      transform: { legacyDecorator: true, decoratorMetadata: true },
      target: 'es2021',
    },
  },
});

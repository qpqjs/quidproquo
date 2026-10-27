// Shared TypeScript module rules for the QPQ backend builds (static lambda
// bundles, federated remotes, the dev server). The views build has its own
// react-flavoured swc options in getViewsRspackConfig. Dependency-specific
// build quirks (ignored modules/warnings) are config-driven via
// `defineBackendBundleOptions`: nothing package-specific lives here.
import { USER_SCRIPT_MODULE_TYPES_QUERY } from '@qpqjs/core';

import path from 'path';
import { RuleSetRule } from '@rspack/core';

// TypeScript via rspack's builtin swc loader. Decorators on to match
// @qpqjs/tsconfig; services are plain node code so no react transform.
const swcNodeOptions = (tsx: boolean) => ({
  jsc: {
    parser: { syntax: 'typescript', tsx, decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
    target: 'es2021',
  },
});

// A user script module's `types` entry is required with this query (defineUserScriptModule):
// it is never compiled, only read for its declarations.
const userScriptModuleTypesQuery = new RegExp(USER_SCRIPT_MODULE_TYPES_QUERY);

export const serviceTsRules = (): RuleSetRule[] => [
  {
    test: /\.ts$/,
    exclude: /node_modules/,
    resourceQuery: { not: [userScriptModuleTypesQuery] },
    loader: 'builtin:swc-loader',
    options: swcNodeOptions(false),
  },
  {
    test: /\.tsx?$/,
    resourceQuery: userScriptModuleTypesQuery,
    type: 'javascript/auto',
    // A plain path, resolved by rspack: the compiled loader is .js, its source .ts under tests.
    loader: path.join(__dirname, '../loaders/userScriptModuleTypesLoader'),
  },
  {
    test: /\.tsx$/,
    exclude: /node_modules/,
    loader: 'builtin:swc-loader',
    options: swcNodeOptions(true),
  },
  {
    // Emit referenced txt/map assets as files next to the bundle.
    test: /\.(txt|map)$/,
    type: 'asset/resource',
  },
];

import path from 'path';
import type { Configuration } from '@rspack/core';

import { createUserScriptExternals } from './createUserScriptExternals';
import { USER_SCRIPT_OUTPUT_FILENAME } from './USER_SCRIPT_OUTPUT_FILENAME';
import { userScriptTsRule } from './userScriptTsRule';

export type UserScriptRspackConfigOptions = {
  projectDir: string;
  // Absolute path of the entry file (see resolveUserScriptEntry).
  entryPath: string;
  outDir: string;
};

/**
 * The rspack config that bundles a script project into one CommonJS `main.js`: the
 * author's files and npm packages folded in, the shared framework packages external,
 * no chunks, a full source map beside it. TypeScript goes through swc, so nothing is
 * type checked here.
 */
export const getUserScriptRspackConfig = ({ projectDir, entryPath, outDir }: UserScriptRspackConfigOptions): Configuration => ({
  context: projectDir,
  mode: 'production',
  target: 'node',

  entry: { main: entryPath },

  output: {
    path: outDir,
    filename: USER_SCRIPT_OUTPUT_FILENAME,
    library: { type: 'commonjs2' },
    clean: true,
  },

  externals: [createUserScriptExternals()],
  externalsType: 'commonjs',

  // The output is read from a drive, never served, so size does not matter and the
  // map must point at the author's TypeScript for lambda stack traces.
  devtool: 'source-map',
  optimization: {
    minimize: false,
    splitChunks: false,
    runtimeChunk: false,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    modules: [path.join(projectDir, 'node_modules'), 'node_modules'],
  },

  module: {
    // A dynamic import must land in the one file, not a sibling chunk.
    parser: { javascript: { dynamicImportMode: 'eager' } },
    rules: [userScriptTsRule()],
  },
});

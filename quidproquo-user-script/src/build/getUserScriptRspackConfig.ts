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
  // Embed a source map in main.js; never a separate .map file.
  sourceMap: boolean;
};

/**
 * The rspack config that bundles a script project into one CommonJS `main.js`: the
 * author's files and npm packages folded in, the shared framework packages external,
 * no chunks, and a source map only when asked for, embedded in `main.js`. TypeScript goes
 * through swc, so nothing is type checked here.
 */
export const getUserScriptRspackConfig = ({ projectDir, entryPath, outDir, sourceMap }: UserScriptRspackConfigOptions): Configuration => ({
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

  // The build is ONE file, so a map can only ride inside it. The output is read from a
  // drive, never served, so the size an inline map adds does not matter.
  devtool: sourceMap ? 'inline-source-map' : false,
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

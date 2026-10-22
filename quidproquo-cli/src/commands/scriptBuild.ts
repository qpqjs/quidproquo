// `qpq script:build <dir> [--out <dir>]` — bundle a user-script project into one
// main.js (plus source map) that askUserScriptExecute can load from a drive.
import { buildUserScript, UserScriptBuildError } from 'quidproquo-deploy-rspack';

import path from 'path';

import { getArgValue, getPositionalArgs } from '../lib/args';

export const scriptBuildCommand = async (argv: string[]): Promise<void> => {
  const [projectDir] = getPositionalArgs(argv, ['--out']);
  if (!projectDir) {
    console.error('Usage: qpq script:build <dir> [--out <dir>]');
    process.exit(1);
  }

  const outDir = getArgValue(argv, '--out') ?? path.join(projectDir, 'dist');

  try {
    const result = await buildUserScript({ projectDir, outDir });
    console.log(`script:build: wrote ${result.entryPath}`);
    console.log(`  exports: ${result.exports.join(', ')}`);
  } catch (error) {
    if (error instanceof UserScriptBuildError) {
      console.error(`script:build: ${error.code}: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
};

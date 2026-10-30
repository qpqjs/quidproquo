// `qpq script:build <dir> [--out <dir>] [--source-map]`, bundle a user-script project
// into one main.js that askUserScriptExecute can load from a drive. `--source-map`
// embeds the map in main.js; no separate .map file is ever written.
import { buildUserScript, checkUserScriptOutput, UserScriptBuildError } from '@qpqjs/user-script';

import path from 'path';

import { getArgValue, getPositionalArgs, hasArgFlag } from '../lib/args';
import { createOutput } from '../lib/out';

const out = createOutput('script:build');

export const scriptBuildCommand = async (argv: string[]): Promise<void> => {
  const [projectDir] = getPositionalArgs(argv, ['--out']);
  if (!projectDir) {
    out.error('Usage: qpq script:build <dir> [--out <dir>] [--source-map]');
    process.exit(1);
  }

  const outDir = getArgValue(argv, '--out') ?? path.join(projectDir, 'dist');

  try {
    const result = await buildUserScript({ projectDir, outDir, sourceMap: hasArgFlag(argv, '--source-map') });
    // A developer's own build is checked in this process; a platform build asks the sandbox.
    const exports = checkUserScriptOutput(result.entryPath);
    out.log(`script:build: wrote ${result.entryPath}`);
    out.log(`  exports: ${exports.join(', ')}`);
  } catch (error) {
    if (error instanceof UserScriptBuildError) {
      out.error(`script:build: ${error.code}: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
};

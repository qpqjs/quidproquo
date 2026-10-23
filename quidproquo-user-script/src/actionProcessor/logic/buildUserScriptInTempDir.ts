import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildUserScript } from '../../build/buildUserScript';
import { BuiltUserScript } from './BuiltUserScript';

/**
 * The part of a platform build that is the same whatever the source is: a temp project
 * directory that `materialise` fills, the build, the outputs read back, and the temp
 * directory removed whatever happened. Errors from `materialise` and from the build
 * propagate for the caller to map.
 */
export const buildUserScriptInTempDir = async (materialise: (projectDir: string) => Promise<void> | void): Promise<BuiltUserScript> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-user-script-'));
  const projectDir = path.join(tempDir, 'project');
  const outDir = path.join(tempDir, 'out');

  try {
    fs.mkdirSync(projectDir, { recursive: true });
    await materialise(projectDir);
    const result = await buildUserScript({ projectDir, outDir });

    return {
      script: fs.readFileSync(result.entryPath, 'utf8'),
      sourceMap: fs.readFileSync(result.sourceMapPath, 'utf8'),
      exports: result.exports,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

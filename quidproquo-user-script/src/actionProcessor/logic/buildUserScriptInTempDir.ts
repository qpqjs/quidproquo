import { UserScriptModuleMap } from 'quidproquo-actionprocessor-node';

import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildUserScript } from '../../build/buildUserScript';
import { BuiltUserScript } from './BuiltUserScript';

/**
 * The part of a platform build that is the same whatever the source is: a temp project
 * directory that `materialise` fills, the build, the output read back, and the temp
 * directory removed whatever happened. Errors from `materialise` and from the build
 * propagate for the caller to map.
 */
export const buildUserScriptInTempDir = async (
  materialise: (projectDir: string) => Promise<void> | void,
  sourceMap: boolean,
  hostModules: UserScriptModuleMap,
): Promise<BuiltUserScript> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-user-script-'));
  const projectDir = path.join(tempDir, 'project');
  const outDir = path.join(tempDir, 'out');

  try {
    fs.mkdirSync(projectDir, { recursive: true });
    await materialise(projectDir);
    const result = await buildUserScript({ projectDir, outDir, sourceMap, hostModules });

    return { script: fs.readFileSync(result.entryPath, 'utf8') };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

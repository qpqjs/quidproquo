import fs from 'fs';
import path from 'path';

import { checkUserScriptOutput } from './checkUserScriptOutput';
import { getUserScriptRspackConfig } from './getUserScriptRspackConfig';
import { resolveUserScriptEntry } from './resolveUserScriptEntry';
import { runUserScriptRspack } from './runUserScriptRspack';
import { USER_SCRIPT_OUTPUT_FILENAME } from './USER_SCRIPT_OUTPUT_FILENAME';
import { UserScriptBuildError, UserScriptBuildErrorCode } from './UserScriptBuildError';
import { UserScriptBuildResult } from './UserScriptBuildResult';

export type BuildUserScriptOptions = {
  projectDir: string;
  outDir: string;
};

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * Builds a script project into `<outDir>/main.js` (plus its source map) and checks the
 * result loads under the execute processor's loader. Throws UserScriptBuildError; the
 * `code` says whether the project, the bundle, or the output contract was at fault.
 * `outDir` is emptied first.
 */
export const buildUserScript = async ({ projectDir, outDir }: BuildUserScriptOptions): Promise<UserScriptBuildResult> => {
  const absoluteProjectDir = path.resolve(projectDir);
  const absoluteOutDir = path.resolve(outDir);
  const entrySource = resolveUserScriptEntry(absoluteProjectDir);

  try {
    await runUserScriptRspack(getUserScriptRspackConfig({ projectDir: absoluteProjectDir, entryPath: entrySource, outDir: absoluteOutDir }));
  } catch (error) {
    throw new UserScriptBuildError(UserScriptBuildErrorCode.BuildFailed, `Building [${absoluteProjectDir}] failed:\n${getErrorMessage(error)}`);
  }

  const emittedScripts = fs.readdirSync(absoluteOutDir).filter((name) => name.endsWith('.js'));
  if (emittedScripts.length !== 1 || emittedScripts[0] !== USER_SCRIPT_OUTPUT_FILENAME) {
    throw new UserScriptBuildError(
      UserScriptBuildErrorCode.OutputNotSingleFile,
      `Building [${absoluteProjectDir}] emitted [${emittedScripts.join(', ')}]; a script must build to exactly ${USER_SCRIPT_OUTPUT_FILENAME}`,
    );
  }

  const entryPath = path.join(absoluteOutDir, USER_SCRIPT_OUTPUT_FILENAME);

  return {
    entryPath,
    sourceMapPath: `${entryPath}.map`,
    exports: checkUserScriptOutput(entryPath),
  };
};

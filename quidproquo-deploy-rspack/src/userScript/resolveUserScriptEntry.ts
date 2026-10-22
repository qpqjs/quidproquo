import fs from 'fs';
import path from 'path';

import { USER_SCRIPT_ENTRY_CANDIDATES } from './USER_SCRIPT_ENTRY_CANDIDATES';
import { UserScriptBuildError, UserScriptBuildErrorCode } from './UserScriptBuildError';

/** The absolute entry path of a script project, or a NoEntry error naming what was looked for. */
export const resolveUserScriptEntry = (projectDir: string): string => {
  const found = USER_SCRIPT_ENTRY_CANDIDATES.map((candidate) => path.join(projectDir, candidate)).find((candidate) => fs.existsSync(candidate));

  if (!found) {
    throw new UserScriptBuildError(
      UserScriptBuildErrorCode.NoEntry,
      `No script entry in [${projectDir}]: expected one of ${USER_SCRIPT_ENTRY_CANDIDATES.join(', ')}`,
    );
  }

  return found;
};

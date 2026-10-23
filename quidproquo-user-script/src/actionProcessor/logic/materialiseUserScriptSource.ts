import fs from 'fs';
import path from 'path';

import { UserScriptBuildError, UserScriptBuildErrorCode } from '../../build/UserScriptBuildError';
import { isSafeProjectPath } from './isSafeProjectPath';
import { UserScriptSourceFile } from './UserScriptSourceFile';

/** Writes collected source files under the project directory, refusing any path that would leave it. */
export const materialiseUserScriptSource = (projectDir: string, files: UserScriptSourceFile[]): void => {
  for (const file of files) {
    if (!isSafeProjectPath(file.path)) {
      throw new UserScriptBuildError(UserScriptBuildErrorCode.BuildFailed, `Refusing source path [${file.path}]`);
    }
    const target = path.join(projectDir, ...file.path.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.text);
  }
};

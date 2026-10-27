import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { AUTH_USER_DIRECTORY_GLOBAL_KEY } from '../../config';

export function* askGetAuthUserDirectoryName(): AskResponse<string> {
  return yield* askConfigGetGlobal<string>(AUTH_USER_DIRECTORY_GLOBAL_KEY);
}

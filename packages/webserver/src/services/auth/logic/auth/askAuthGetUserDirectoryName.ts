import { askConfigGetGlobal, AskResponse } from '@qpqjs/core';

import { AUTH_USER_DIRECTORY_GLOBAL_KEY } from '../../config';

export function* askAuthGetUserDirectoryName(): AskResponse<string> {
  return yield* askConfigGetGlobal<string>(AUTH_USER_DIRECTORY_GLOBAL_KEY);
}

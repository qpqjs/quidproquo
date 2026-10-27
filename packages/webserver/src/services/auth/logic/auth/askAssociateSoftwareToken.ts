import { AskResponse, askUserDirectoryAssociateSoftwareToken, AssociateSoftwareTokenResult } from 'quidproquo-core';

import { askGetAuthUserDirectoryName } from './askGetAuthUserDirectoryName';

export function* askAssociateSoftwareToken(session: string): AskResponse<AssociateSoftwareTokenResult> {
  const userDirectoryName = yield* askGetAuthUserDirectoryName();

  return yield* askUserDirectoryAssociateSoftwareToken(userDirectoryName, session);
}

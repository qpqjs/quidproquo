import { AskResponse, askUserDirectoryAssociateSoftwareToken, AssociateSoftwareTokenResult } from '@qpqjs/core';

import { askGetAuthUserDirectoryName } from './askGetAuthUserDirectoryName';

export function* askAssociateSoftwareToken(session: string): AskResponse<AssociateSoftwareTokenResult> {
  const userDirectoryName = yield* askGetAuthUserDirectoryName();

  return yield* askUserDirectoryAssociateSoftwareToken(userDirectoryName, session);
}

import { AskResponse, askUserDirectoryAssociateSoftwareToken, AssociateSoftwareTokenResult } from '@qpqjs/core';

import { askAuthGetUserDirectoryName } from './askAuthGetUserDirectoryName';

export function* askAuthAssociateSoftwareToken(session: string): AskResponse<AssociateSoftwareTokenResult> {
  const userDirectoryName = yield* askAuthGetUserDirectoryName();

  return yield* askUserDirectoryAssociateSoftwareToken(userDirectoryName, session);
}

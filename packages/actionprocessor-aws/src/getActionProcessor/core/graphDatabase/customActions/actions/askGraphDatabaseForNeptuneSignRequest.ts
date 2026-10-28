import { createActionRequester } from '@qpqjs/core';

import { GraphDatabaseForNeptuneActionType } from './GraphDatabaseForNeptuneActionType';

/** SigV4 headers for a neptune-db POST of exactly `body` to `url`, signed with the runtime's own credentials. */
export const askGraphDatabaseForNeptuneSignRequest = createActionRequester<Record<string, string>>()({
  actionType: GraphDatabaseForNeptuneActionType.SignRequest,
  getPayload: (url: string, body: string) => ({ url, body }),
});

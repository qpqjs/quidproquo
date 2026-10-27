import { createActionRequester } from '@qpqjs/core';

import { WebEntryActionType } from './WebEntryActionType';

export const askWebEntryInvalidateCache = createActionRequester<void>()({
  actionType: WebEntryActionType.InvalidateCache,
  getPayload: (webEntryName: string, ...paths: string[]) => ({ webEntryName, paths }),
});

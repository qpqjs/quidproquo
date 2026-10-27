import { createActionRequester } from 'quidproquo-core';

import { WebEntryActionType } from './WebEntryActionType';

export const askWebEntryInvalidateCache = createActionRequester<void>()({
  actionType: WebEntryActionType.InvalidateCache,
  getPayload: (webEntryName: string, ...paths: string[]) => ({ webEntryName, paths }),
});

import { createActionRequester } from 'quidproquo-core';

import { DnsActionType } from './DnsActionType';

/** The root domains the service declared with defineDns, primary first; empty without a domain. */
export const askDnsList = createActionRequester<string[]>()({
  actionType: DnsActionType.List,
});

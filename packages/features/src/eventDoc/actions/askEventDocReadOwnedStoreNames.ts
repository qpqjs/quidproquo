import { createActionRequester } from '@qpqjs/core';

import { EventDocActionType } from './EventDocActionType';

/**
 * The store names of the event-doc collections this service owns, read from its config at runtime: what a whole-service
 * job (a reproject of everything) walks. Needs the processor defineAdminSettings registers.
 */
export const askEventDocReadOwnedStoreNames = createActionRequester<string[]>()({
  actionType: EventDocActionType.ReadOwnedStoreNames,
});

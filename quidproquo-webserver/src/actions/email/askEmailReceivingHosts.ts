import { createActionRequester } from 'quidproquo-core';

import { EmailActionType } from './EmailActionType';

/**
 * The app's receiving hosts (defineEmailReceivingDomain resolved on every root, primary first),
 * so a story can show a full address for a local part. Empty when the app declares no
 * receiving domain.
 */
export const askEmailReceivingHosts = createActionRequester<string[]>()({
  actionType: EmailActionType.ReceivingHosts,
  getPayload: () => ({}),
});

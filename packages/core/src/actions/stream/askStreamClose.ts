import { createActionRequester } from '../../types';
import { StreamHandle } from '../../types/StreamRegistry';
import { StreamActionType } from './StreamActionType';

export const askStreamClose = createActionRequester<void>()({
  actionType: StreamActionType.Close,
  getPayload: (handle: StreamHandle) => ({ streamId: handle.id }),
});

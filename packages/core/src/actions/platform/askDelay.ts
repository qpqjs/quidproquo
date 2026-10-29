import { createActionRequester } from '../../logic/actions';
import { PlatformActionType } from './PlatformActionType';

export const askDelay = createActionRequester<void>()({
  actionType: PlatformActionType.Delay,
  getPayload: (timeMs: number) => ({ timeMs }),
});

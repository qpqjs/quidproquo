import { createActionRequester } from '../../types';
import { PlatformActionType } from './PlatformActionType';

/**
 * The name of the runtime executing the story, as its action processor set declares it.
 * An opaque string a story compares against a known constant to skip or degrade work a
 * platform cannot do (a smoke test with no local equivalent, say). Never branch on it
 * for ordinary logic; that is what action processors are for.
 */
export const askPlatformGetName = createActionRequester<string>()({
  actionType: PlatformActionType.GetName,
  getPayload: () => ({}),
});

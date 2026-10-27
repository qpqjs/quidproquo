import { createActionRequester } from '../../types';
import { SystemActionType } from './SystemActionType';

// Returns the correlation guid for the currently executing story. The correlation
// links all of a story's actions (and its sub-stories) together in the logs, so it
// is the handle to store when you want to link back to admin / execution history.
export const askGetRuntimeCorrelation = createActionRequester<string>()({
  actionType: SystemActionType.GetRuntimeCorrelation,
});

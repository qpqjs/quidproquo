import { QpqExecutionTrace, StoryResult } from '../../types';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { SystemActionType } from './SystemActionType';

export interface SystemTraceStoryActionPayload {
  storyResult: StoryResult<any>;

  // Regex sources matched against script urls to trace in addition to the story
  // function's own script (bundles split across chunks).
  scriptPatterns?: string[];

  // Only break on statements whose source-mapped origin is the service's own code —
  // positions mapping into node_modules (framework/deps) get no breakpoints, so the
  // step budget is spent entirely on user statements.
  onlyOwnCode?: boolean;
}

export const askTraceStory = createActionRequester<QpqExecutionTrace>()({
  actionType: SystemActionType.TraceStory,
  getPayload: (storyResult: StoryResult<any>, scriptPatterns?: string[], onlyOwnCode?: boolean) => ({ storyResult, scriptPatterns, onlyOwnCode }),
});

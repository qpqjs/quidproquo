import { SystemActionType } from '@qpqjs/core';

const coreSystemActionComponentMap: Record<string, string[]> = {
  [SystemActionType.Batch]: ['askBatch', 'actions'],
  [SystemActionType.ExecuteStory]: ['askExecuteStory', 'runtime', 'params', 'storySession'],
  [SystemActionType.GetRuntimeCorrelation]: ['askGetRuntimeCorrelation'],
};

export default coreSystemActionComponentMap;

import { InlineFunctionActionType } from 'quidproquo-core';

const coreInlineFunctionActionComponentMap: Record<string, string[]> = {
  [InlineFunctionActionType.Execute]: ['askInlineFunctionExecute', 'functionName', 'payload'],
};

export default coreInlineFunctionActionComponentMap;

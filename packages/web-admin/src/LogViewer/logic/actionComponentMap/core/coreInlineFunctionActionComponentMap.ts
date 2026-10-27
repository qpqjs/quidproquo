import { InlineFunctionActionType } from '@qpqjs/core';

const coreInlineFunctionActionComponentMap: Record<string, string[]> = {
  [InlineFunctionActionType.Execute]: ['askInlineFunctionExecute', 'functionName', 'payload'],
};

export default coreInlineFunctionActionComponentMap;

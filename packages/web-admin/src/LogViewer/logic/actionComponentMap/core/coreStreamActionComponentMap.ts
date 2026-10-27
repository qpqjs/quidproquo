import { StreamActionType } from 'quidproquo-core';

const coreStreamActionComponentMap: Record<string, string[]> = {
  [StreamActionType.Read]: ['askStreamRead', 'streamId', 'noWait'],
  [StreamActionType.Close]: ['askStreamClose', 'streamId'],
};

export default coreStreamActionComponentMap;

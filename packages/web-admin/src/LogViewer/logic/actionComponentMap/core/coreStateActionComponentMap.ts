import { StateActionType } from 'quidproquo-core';

const coreStateActionComponentMap: Record<string, string[]> = {
  [StateActionType.Dispatch]: ['askStateDispatch', 'action'],
  [StateActionType.Read]: ['askStateRead', 'path'],
};

export default coreStateActionComponentMap;

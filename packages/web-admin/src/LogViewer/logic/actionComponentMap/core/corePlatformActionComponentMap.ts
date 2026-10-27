import { PlatformActionType } from 'quidproquo-core';

const corePlatformActionComponentMap: Record<string, string[]> = {
  [PlatformActionType.Delay]: ['askDelay', 'timeMs'],
  [PlatformActionType.GetName]: ['askPlatformGetName'],
};

export default corePlatformActionComponentMap;

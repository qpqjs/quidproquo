import { PlatformActionType } from '@qpqjs/core';

const corePlatformActionComponentMap: Record<string, string[]> = {
  [PlatformActionType.Delay]: ['askPlatformDelay', 'timeMs'],
  [PlatformActionType.GetName]: ['askPlatformGetName'],
};

export default corePlatformActionComponentMap;

import type { SystemModelMessage } from 'ai';

import { BedrockCachePointRole, BedrockCacheSettings } from '../types';
import { toBedrockCachePoint } from './toBedrockCachePoint';

// Bedrock reads cache points off message objects, not the bare `system` string, so caching shapes
// the system prompt as a SystemModelMessage. Its checkpoint covers the cumulative prefix, tool
// definitions included, so the tools need no checkpoint of their own.
export const toCacheableSystem = (
  system: string | undefined,
  caching: boolean | undefined,
  cache: BedrockCacheSettings,
): string | SystemModelMessage | undefined => {
  if (!system) {
    return undefined;
  }

  if (!caching) {
    return system;
  }

  return {
    role: 'system',
    content: system,
    providerOptions: {
      bedrock: { cachePoint: toBedrockCachePoint(cache, BedrockCachePointRole.System) },
    },
  };
};

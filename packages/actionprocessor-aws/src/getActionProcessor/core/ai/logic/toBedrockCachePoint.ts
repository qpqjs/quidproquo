import { AiCacheTtl } from 'quidproquo-core';

import { bedrockOneHourCacheModels } from '../bedrockOneHourCacheModels';
import { BedrockCachePointRole, BedrockCacheSettings } from '../types';

export type BedrockCachePoint = { type: 'default' } | { type: 'default'; ttl: '1h' };

/**
 * The Bedrock cache checkpoint for a model, a requested lifetime and the point's place in the
 * request. Exhaustive over `AiCacheTtl`, so a new member fails to compile here until this
 * provider says what it does with it.
 */
export const toBedrockCachePoint = (
  { model, cacheTtl = AiCacheTtl.Dynamic }: BedrockCacheSettings,
  role: BedrockCachePointRole,
): BedrockCachePoint => {
  // The tail is read by the next step seconds later and discarded when the call ends, so the
  // doubled hour write would buy nothing there whatever lifetime was asked for. It also keeps
  // the hour entries ahead of the five-minute one, the order Bedrock requires.
  if (role === BedrockCachePointRole.Tail) {
    return { type: 'default' };
  }

  // A model that cannot cache for an hour rejects the field, failing the whole request, so it
  // gets the default lifetime instead.
  const oneHour: BedrockCachePoint = bedrockOneHourCacheModels.has(model) ? { type: 'default', ttl: '1h' } : { type: 'default' };

  switch (cacheTtl) {
    // The system prompt and the saved-history anchor have to outlive a user's pause between
    // turns. Dynamic pins nothing and may adapt later; OneHour is the caller's explicit ask.
    case AiCacheTtl.Dynamic:
    case AiCacheTtl.OneHour:
      return oneHour;

    // Five minutes is what Bedrock does without the field, and models that support nothing
    // else reject the field outright, so an explicit five minutes omits it like the default.
    case AiCacheTtl.FiveMinutes:
    case AiCacheTtl.ProviderDefault:
      return { type: 'default' };
  }
};

import { omitKey } from 'quidproquo-core';

import type { ModelMessage } from 'ai';

import { BedrockCachePointRole, BedrockCacheSettings } from '../types';
import { toBedrockCachePoint } from './toBedrockCachePoint';

export type CacheableMessagesOptions = BedrockCacheSettings & {
  /** How many leading messages are the saved conversation. Defaults to all of them. */
  durableCount?: number;
  /** Also mark the last message when the list runs past the saved conversation. */
  markTail?: boolean;
};

type ProviderOptions = NonNullable<ModelMessage['providerOptions']>;

// The Bedrock provider reads a cache point from either spelling, so both have to be stripped.
const CACHE_POINT_PROVIDERS = ['bedrock', 'amazonBedrock'] as const;

/**
 * A copy of the message without any cache point. A provider bag or `providerOptions` that held
 * nothing but the point is dropped too, so a message comes back exactly as it was before it was
 * marked. An unmarked message is returned as the same object.
 */
const withoutCachePoint = (message: ModelMessage): ModelMessage => {
  if (!message.providerOptions) {
    return message;
  }

  let providerOptions: ProviderOptions = message.providerOptions;

  for (const provider of CACHE_POINT_PROVIDERS) {
    const options = providerOptions[provider];

    if (options && 'cachePoint' in options) {
      const rest = omitKey(options, 'cachePoint');
      providerOptions = Object.keys(rest).length > 0 ? { ...providerOptions, [provider]: rest } : omitKey(providerOptions, provider);
    }
  }

  if (providerOptions === message.providerOptions) {
    return message;
  }

  return Object.keys(providerOptions).length > 0 ? { ...message, providerOptions } : (omitKey(message, 'providerOptions') as ModelMessage);
};

/** A copy of the message with a cache point, keeping any other provider options it carries. */
const withCachePoint = (message: ModelMessage, cache: BedrockCacheSettings, role: BedrockCachePointRole): ModelMessage => ({
  ...message,
  providerOptions: {
    ...message.providerOptions,
    bedrock: { ...message.providerOptions?.bedrock, cachePoint: toBedrockCachePoint(cache, role) },
  },
});

/**
 * Places the request's message cache points. One goes on the last saved message (index
 * `durableCount - 1`): the next turn re-sends the saved history byte for byte, so that is the
 * boundary its own request hits. With `markTail`, and a list that runs past the saved messages,
 * one more goes on the last message so the tool traffic a step appended is read from cache by
 * the step after it. Existing points are removed first: the AI SDK hands each step the previous
 * step's marked list, and Bedrock allows four checkpoints per request.
 */
export const toCacheableMessages = (messages: ModelMessage[], caching: boolean | undefined, options: CacheableMessagesOptions): ModelMessage[] => {
  if (!caching || messages.length === 0) {
    return messages;
  }

  const durableCount = Math.min(options.durableCount ?? messages.length, messages.length);

  // -1 matches no index: no anchor when every message is turn context, no tail until the list
  // has grown past the saved messages.
  const anchorIndex = durableCount - 1;
  const tailIndex = options.markTail && messages.length > durableCount ? messages.length - 1 : -1;

  return messages.map(withoutCachePoint).map((message, index) => {
    if (index === anchorIndex) {
      return withCachePoint(message, options, BedrockCachePointRole.Anchor);
    }

    return index === tailIndex ? withCachePoint(message, options, BedrockCachePointRole.Tail) : message;
  });
};

import { AiMessage } from 'quidproquo-core';

import type { ModelMessage } from 'ai';

import { AiDriveFileResolver, toSdkMessages } from './toSdkMessages';

export type AiPromptInputPayload = {
  prompt: string;
  messages?: AiMessage[];
  turnContext?: AiMessage[];
};

export type AiPromptInput = {
  /** Spread into the SDK call: `{ prompt }` or `{ messages }`, never both. */
  promptOrMessages: { prompt: string } | { messages: ModelMessage[] };
  /** How many leading messages are the saved conversation; the turn context follows them. */
  durableCount: number;
};

/**
 * The SDK input for a prompt payload. The turn context is appended after the conversation. When
 * only a `prompt` was given alongside it, the prompt becomes the single saved user message,
 * because the SDK refuses `prompt` and `messages` together.
 */
export const buildAiPromptInput = async (payload: AiPromptInputPayload, resolveDriveFile: AiDriveFileResolver): Promise<AiPromptInput> => {
  const turnContext = payload.turnContext ?? [];

  if (!payload.messages && turnContext.length === 0) {
    return { promptOrMessages: { prompt: payload.prompt }, durableCount: 0 };
  }

  const durable: AiMessage[] = payload.messages ?? [{ role: 'user', content: payload.prompt }];
  const messages = await toSdkMessages([...durable, ...turnContext], resolveDriveFile);

  return { promptOrMessages: { messages }, durableCount: durable.length };
};

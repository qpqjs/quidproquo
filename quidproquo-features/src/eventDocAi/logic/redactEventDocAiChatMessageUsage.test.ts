import { AiModel } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import type { EventDocAiChatMessage } from '../models';
import { redactEventDocAiChatMessageUsage } from './redactEventDocAiChatMessageUsage';

describe('redactEventDocAiChatMessageUsage', () => {
  it('drops the usage but keeps the model and segments', () => {
    const message: EventDocAiChatMessage = {
      role: 'assistant',
      segments: [{ type: 'text', text: 'Done.' }],
      model: AiModel.ClaudeSonnet46,
      usage: { inputTokens: 120 },
    };

    expect(redactEventDocAiChatMessageUsage(message)).toEqual({
      role: 'assistant',
      segments: [{ type: 'text', text: 'Done.' }],
      model: AiModel.ClaudeSonnet46,
    });
  });

  it('returns a message without usage as the same object', () => {
    const message: EventDocAiChatMessage = { role: 'user', segments: [{ type: 'text', text: 'Hi' }] };

    expect(redactEventDocAiChatMessageUsage(message)).toBe(message);
  });
});
